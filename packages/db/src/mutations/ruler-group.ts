import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { rulerGroup } from "../schema/ruler-group"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { RulerGroup } from "../schema/ruler-group"

type RulerGroupFields = { code: string; name: string }
type UpdateRulerGroupInput = RulerGroupFields & { id: string }
type DeleteRulerGroupInput = { id: string }
type VersionedRulerGroupInput = { id: string; expectedVersion: number }

export type ReplaceRulerGroupResult =
  | { status: "updated"; rulerGroup: RulerGroup }
  | { status: "missing" | "stale" }
export type DeleteRulerGroupIfVersionResult =
  | { status: "deleted"; rulerGroup: RulerGroup }
  | { status: "missing" | "stale" }
export type CreateRulerGroupIdempotentlyResult =
  | { status: "created" | "replayed"; rulerGroup: RulerGroup }
  | { status: "mismatch" }

function trimRulerGroupFields({ code, name }: RulerGroupFields) {
  return { code: code.trim(), name: name.trim() }
}

export async function createRulerGroup(fields: RulerGroupFields): Promise<RulerGroup> {
  const [createdRulerGroup] = await db
    .insert(rulerGroup)
    .values(trimRulerGroupFields(fields))
    .returning()
  return createdRulerGroup
}

export async function updateRulerGroup({
  id,
  ...fields
}: UpdateRulerGroupInput): Promise<RulerGroup | null> {
  return (
    await db
      .update(rulerGroup)
      .set({ ...trimRulerGroupFields(fields), updatedAt: new Date() })
      .where(eq(rulerGroup.id, id))
      .returning()
  ).at(0) ?? null
}

export async function deleteRulerGroup({ id }: DeleteRulerGroupInput): Promise<RulerGroup | null> {
  return (
    (await db.delete(rulerGroup).where(eq(rulerGroup.id, id)).returning()).at(0) ?? null
  )
}

export function createRulerGroupIdempotently(
  input: Parameters<typeof createRulerGroupIdempotentlyWithDatabase>[1]
) {
  return createRulerGroupIdempotentlyWithDatabase(db, input)
}

export async function createRulerGroupIdempotentlyWithDatabase(
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
    fields: RulerGroupFields
  }
): Promise<CreateRulerGroupIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "ruler-group.create",
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
            eq(entry.operation, "ruler-group.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return { status: "replayed", rulerGroup: deserializeRulerGroup(record.response) }
    }
    const [created] = await transaction
      .insert(rulerGroup)
      .values(trimRulerGroupFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeRulerGroup(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "ruler-group.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", rulerGroup: created }
  })
}

export async function replaceRulerGroupWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedRulerGroupInput & RulerGroupFields
): Promise<ReplaceRulerGroupResult> {
  const updated = (
    await database
      .update(rulerGroup)
      .set({
        ...trimRulerGroupFields(fields),
        updatedAt: new Date(),
        version: sql`${rulerGroup.version} + 1`,
      })
      .where(and(eq(rulerGroup.id, id), eq(rulerGroup.version, expectedVersion)))
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", rulerGroup: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteRulerGroupIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedRulerGroupInput
): Promise<DeleteRulerGroupIfVersionResult> {
  const deleted = (
    await database
      .delete(rulerGroup)
      .where(and(eq(rulerGroup.id, id), eq(rulerGroup.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", rulerGroup: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.rulerGroup.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredRulerGroup = Omit<RulerGroup, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeRulerGroup(record: RulerGroup): StoredRulerGroup {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeRulerGroup(value: unknown): RulerGroup {
  const record = value as StoredRulerGroup
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
