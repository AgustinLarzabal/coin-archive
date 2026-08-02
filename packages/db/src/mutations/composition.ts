import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { composition } from "../schema/composition"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Composition } from "../schema/composition"

type CompositionFields = {
  code: string
  name: string
}

type UpdateCompositionInput = CompositionFields & { id: string }
type DeleteCompositionInput = { id: string }
type VersionedCompositionInput = { id: string; expectedVersion: number }

export type ReplaceCompositionResult =
  | { status: "updated"; composition: Composition }
  | { status: "missing" | "stale" }
export type DeleteCompositionIfVersionResult =
  | { status: "deleted"; composition: Composition }
  | { status: "missing" | "stale" }
export type CreateCompositionIdempotentlyResult =
  | { status: "created" | "replayed"; composition: Composition }
  | { status: "mismatch" }

function trimCompositionFields({ code, name }: CompositionFields) {
  return { code: code.trim(), name: name.trim() }
}

export async function createComposition(
  fields: CompositionFields
): Promise<Composition> {
  const [createdComposition] = await db
    .insert(composition)
    .values(trimCompositionFields(fields))
    .returning()
  return createdComposition
}

export async function updateComposition({
  id,
  ...fields
}: UpdateCompositionInput): Promise<Composition | null> {
  const updatedComposition = (
    await db
      .update(composition)
      .set({ ...trimCompositionFields(fields), updatedAt: new Date() })
      .where(eq(composition.id, id))
      .returning()
  ).at(0)
  return updatedComposition ?? null
}

export async function deleteComposition({
  id,
}: DeleteCompositionInput): Promise<Composition | null> {
  return (
    (await db.delete(composition).where(eq(composition.id, id)).returning()).at(
      0
    ) ?? null
  )
}

export function createCompositionIdempotently(
  input: Parameters<typeof createCompositionIdempotentlyWithDatabase>[1]
) {
  return createCompositionIdempotentlyWithDatabase(db, input)
}

export async function createCompositionIdempotentlyWithDatabase(
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
    fields: CompositionFields
  }
): Promise<CreateCompositionIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "composition.create",
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
            eq(entry.operation, "composition.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return {
        status: "replayed",
        composition: deserializeComposition(record.response),
      }
    }
    const [created] = await transaction
      .insert(composition)
      .values(trimCompositionFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeComposition(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "composition.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", composition: created }
  })
}

export async function replaceCompositionWithDatabase(
  database: typeof databaseClient,
  {
    id,
    expectedVersion,
    ...fields
  }: VersionedCompositionInput & CompositionFields
): Promise<ReplaceCompositionResult> {
  const updated = (
    await database
      .update(composition)
      .set({
        ...trimCompositionFields(fields),
        updatedAt: new Date(),
        version: sql`${composition.version} + 1`,
      })
      .where(
        and(eq(composition.id, id), eq(composition.version, expectedVersion))
      )
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", composition: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteCompositionIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedCompositionInput
): Promise<DeleteCompositionIfVersionResult> {
  const deleted = (
    await database
      .delete(composition)
      .where(
        and(eq(composition.id, id), eq(composition.version, expectedVersion))
      )
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", composition: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.composition.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredComposition = Omit<Composition, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeComposition(record: Composition): StoredComposition {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeComposition(value: unknown): Composition {
  const record = value as StoredComposition
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
