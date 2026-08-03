import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { rim } from "../schema/rim"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Rim } from "../schema/rim"

type RimFields = { code: string; name: string }
type UpdateRimInput = RimFields & { id: string }
type DeleteRimInput = { id: string }
type VersionedRimInput = { id: string; expectedVersion: number }

export type ReplaceRimResult =
  | { status: "updated"; rim: Rim }
  | { status: "missing" | "stale" }
export type DeleteRimIfVersionResult =
  | { status: "deleted"; rim: Rim }
  | { status: "missing" | "stale" }
export type CreateRimIdempotentlyResult =
  | { status: "created" | "replayed"; rim: Rim }
  | { status: "mismatch" }

function trimRimFields({ code, name }: RimFields) {
  return { code: code.trim(), name: name.trim() }
}

export async function createRim(fields: RimFields): Promise<Rim> {
  const [createdRim] = await db
    .insert(rim)
    .values(trimRimFields(fields))
    .returning()
  return createdRim
}

export async function updateRim({
  id,
  ...fields
}: UpdateRimInput): Promise<Rim | null> {
  return (
    await db
      .update(rim)
      .set({ ...trimRimFields(fields), updatedAt: new Date() })
      .where(eq(rim.id, id))
      .returning()
  ).at(0) ?? null
}

export async function deleteRim({ id }: DeleteRimInput): Promise<Rim | null> {
  return (
    (await db.delete(rim).where(eq(rim.id, id)).returning()).at(0) ?? null
  )
}

export function createRimIdempotently(
  input: Parameters<typeof createRimIdempotentlyWithDatabase>[1]
) {
  return createRimIdempotentlyWithDatabase(db, input)
}

export async function createRimIdempotentlyWithDatabase(
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
    fields: RimFields
  }
): Promise<CreateRimIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "rim.create",
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
            eq(entry.operation, "rim.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return { status: "replayed", rim: deserializeRim(record.response) }
    }
    const [created] = await transaction
      .insert(rim)
      .values(trimRimFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeRim(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "rim.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", rim: created }
  })
}

export async function replaceRimWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedRimInput & RimFields
): Promise<ReplaceRimResult> {
  const updated = (
    await database
      .update(rim)
      .set({
        ...trimRimFields(fields),
        updatedAt: new Date(),
        version: sql`${rim.version} + 1`,
      })
      .where(and(eq(rim.id, id), eq(rim.version, expectedVersion)))
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", rim: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteRimIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedRimInput
): Promise<DeleteRimIfVersionResult> {
  const deleted = (
    await database
      .delete(rim)
      .where(and(eq(rim.id, id), eq(rim.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", rim: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.rim.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredRim = Omit<Rim, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeRim(record: Rim): StoredRim {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeRim(value: unknown): Rim {
  const record = value as StoredRim
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
