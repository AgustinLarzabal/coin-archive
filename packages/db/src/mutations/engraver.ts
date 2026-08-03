import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { engraver } from "../schema/engraver"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Engraver } from "../schema/engraver"

type EngraverFields = { code: string; name: string }
type UpdateEngraverInput = EngraverFields & { id: string }
type DeleteEngraverInput = { id: string }
type VersionedEngraverInput = { id: string; expectedVersion: number }

export type ReplaceEngraverResult =
  | { status: "updated"; engraver: Engraver }
  | { status: "missing" | "stale" }
export type DeleteEngraverIfVersionResult =
  | { status: "deleted"; engraver: Engraver }
  | { status: "missing" | "stale" }
export type CreateEngraverIdempotentlyResult =
  | { status: "created" | "replayed"; engraver: Engraver }
  | { status: "mismatch" }

function trimEngraverFields({ code, name }: EngraverFields) {
  return { code: code.trim(), name: name.trim() }
}

export async function createEngraver(fields: EngraverFields): Promise<Engraver> {
  const [createdEngraver] = await db
    .insert(engraver)
    .values(trimEngraverFields(fields))
    .returning()
  return createdEngraver
}

export async function updateEngraver({
  id,
  ...fields
}: UpdateEngraverInput): Promise<Engraver | null> {
  return (
    await db
      .update(engraver)
      .set({ ...trimEngraverFields(fields), updatedAt: new Date() })
      .where(eq(engraver.id, id))
      .returning()
  ).at(0) ?? null
}

export async function deleteEngraver({ id }: DeleteEngraverInput): Promise<Engraver | null> {
  return (
    (await db.delete(engraver).where(eq(engraver.id, id)).returning()).at(0) ?? null
  )
}

export function createEngraverIdempotently(
  input: Parameters<typeof createEngraverIdempotentlyWithDatabase>[1]
) {
  return createEngraverIdempotentlyWithDatabase(db, input)
}

export async function createEngraverIdempotentlyWithDatabase(
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
    fields: EngraverFields
  }
): Promise<CreateEngraverIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "engraver.create",
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
            eq(entry.operation, "engraver.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return { status: "replayed", engraver: deserializeEngraver(record.response) }
    }
    const [created] = await transaction
      .insert(engraver)
      .values(trimEngraverFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeEngraver(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "engraver.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", engraver: created }
  })
}

export async function replaceEngraverWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedEngraverInput & EngraverFields
): Promise<ReplaceEngraverResult> {
  const updated = (
    await database
      .update(engraver)
      .set({
        ...trimEngraverFields(fields),
        updatedAt: new Date(),
        version: sql`${engraver.version} + 1`,
      })
      .where(and(eq(engraver.id, id), eq(engraver.version, expectedVersion)))
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", engraver: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteEngraverIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedEngraverInput
): Promise<DeleteEngraverIfVersionResult> {
  const deleted = (
    await database
      .delete(engraver)
      .where(and(eq(engraver.id, id), eq(engraver.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", engraver: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.engraver.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredEngraver = Omit<Engraver, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeEngraver(record: Engraver): StoredEngraver {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeEngraver(value: unknown): Engraver {
  const record = value as StoredEngraver
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
