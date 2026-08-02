import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { distribution } from "../schema/distribution"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Distribution } from "../schema/distribution"

type DistributionFields = {
  code: string
  name: string
}

type UpdateDistributionInput = DistributionFields & { id: string }
type DeleteDistributionInput = { id: string }
type VersionedDistributionInput = { id: string; expectedVersion: number }

export type ReplaceDistributionResult =
  | { status: "updated"; distribution: Distribution }
  | { status: "missing" | "stale" }
export type DeleteDistributionIfVersionResult =
  | { status: "deleted"; distribution: Distribution }
  | { status: "missing" | "stale" }
export type CreateDistributionIdempotentlyResult =
  | { status: "created" | "replayed"; distribution: Distribution }
  | { status: "mismatch" }

function trimDistributionFields({ code, name }: DistributionFields) {
  return { code: code.trim(), name: name.trim() }
}

export async function createDistribution(
  fields: DistributionFields
): Promise<Distribution> {
  const [createdDistribution] = await db
    .insert(distribution)
    .values(trimDistributionFields(fields))
    .returning()
  return createdDistribution
}

export async function updateDistribution({
  id,
  ...fields
}: UpdateDistributionInput): Promise<Distribution | null> {
  const updatedDistribution = (
    await db
      .update(distribution)
      .set({ ...trimDistributionFields(fields), updatedAt: new Date() })
      .where(eq(distribution.id, id))
      .returning()
  ).at(0)
  return updatedDistribution ?? null
}

export async function deleteDistribution({
  id,
}: DeleteDistributionInput): Promise<Distribution | null> {
  return (
    (await db.delete(distribution).where(eq(distribution.id, id)).returning()).at(
      0
    ) ?? null
  )
}

export function createDistributionIdempotently(
  input: Parameters<typeof createDistributionIdempotentlyWithDatabase>[1]
) {
  return createDistributionIdempotentlyWithDatabase(db, input)
}

export async function createDistributionIdempotentlyWithDatabase(
  database: typeof databaseClient,
  {
    collectorId,
    idempotencyKey,
    requestHash,
    expiresAt,
    fields,
  }: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    expiresAt: Date
    fields: DistributionFields
  }
): Promise<CreateDistributionIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "distribution.create",
          key: idempotencyKey,
          requestHash,
          expiresAt,
        })
        .onConflictDoNothing()
        .returning()
    ).at(0)
    const record =
      inserted ??
      (await transaction.query.maintenanceIdempotency.findFirst({
        where: (entry, { and, eq }) =>
          and(
            eq(entry.collectorId, collectorId),
            eq(entry.operation, "distribution.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return {
        status: "replayed",
        distribution: deserializeDistribution(record.response),
      }
    }
    const [created] = await transaction
      .insert(distribution)
      .values(trimDistributionFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeDistribution(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "distribution.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", distribution: created }
  })
}

export async function replaceDistributionWithDatabase(
  database: typeof databaseClient,
  {
    id,
    expectedVersion,
    ...fields
  }: VersionedDistributionInput & DistributionFields
): Promise<ReplaceDistributionResult> {
  const updated = (
    await database
      .update(distribution)
      .set({
        ...trimDistributionFields(fields),
        updatedAt: new Date(),
        version: sql`${distribution.version} + 1`,
      })
      .where(
        and(eq(distribution.id, id), eq(distribution.version, expectedVersion))
      )
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", distribution: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteDistributionIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedDistributionInput
): Promise<DeleteDistributionIfVersionResult> {
  const deleted = (
    await database
      .delete(distribution)
      .where(
        and(eq(distribution.id, id), eq(distribution.version, expectedVersion))
      )
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", distribution: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.distribution.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredDistribution = Omit<Distribution, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeDistribution(record: Distribution): StoredDistribution {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeDistribution(value: unknown): Distribution {
  const record = value as StoredDistribution
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
