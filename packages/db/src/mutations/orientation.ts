import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { orientation } from "../schema/orientation"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Orientation } from "../schema/orientation"

type OrientationFields = {
  code: string
  name: string
}

type UpdateOrientationInput = OrientationFields & {
  id: string
}

type DeleteOrientationInput = {
  id: string
}

type VersionedOrientationInput = {
  id: string
  expectedVersion: number
}

export type ReplaceOrientationResult =
  | { status: "updated"; orientation: Orientation }
  | { status: "missing" | "stale" }

export type DeleteOrientationIfVersionResult =
  | { status: "deleted"; orientation: Orientation }
  | { status: "missing" | "stale" }

type StoredOrientation = Omit<Orientation, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

export type CreateOrientationIdempotentlyResult =
  | { status: "created" | "replayed"; orientation: Orientation }
  | { status: "mismatch" }

function takeFirstOrNull<T>(records: T[]): T | null {
  return records.at(0) ?? null
}

function normalizeOrientationFields({ code, name }: OrientationFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createOrientation(
  fields: OrientationFields
): Promise<Orientation> {
  const [createdOrientation] = await db
    .insert(orientation)
    .values(normalizeOrientationFields(fields))
    .returning()

  return createdOrientation
}

export async function updateOrientation({
  id,
  ...fields
}: UpdateOrientationInput): Promise<Orientation | null> {
  return takeFirstOrNull(
    await db
      .update(orientation)
      .set({
        ...normalizeOrientationFields(fields),
        updatedAt: new Date(),
        version: sql`${orientation.version} + 1`,
      })
      .where(eq(orientation.id, id))
      .returning()
  )
}

export async function deleteOrientation({
  id,
}: DeleteOrientationInput): Promise<Orientation | null> {
  return takeFirstOrNull(
    await db.delete(orientation).where(eq(orientation.id, id)).returning()
  )
}

export function createOrientationIdempotently(
  input: Parameters<typeof createOrientationIdempotentlyWithDatabase>[1]
) {
  return createOrientationIdempotentlyWithDatabase(db, input)
}

export async function createOrientationIdempotentlyWithDatabase(
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
    fields: OrientationFields
  }
): Promise<CreateOrientationIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))

    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "orientation.create",
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
            eq(entry.operation, "orientation.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))

    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return {
        status: "replayed",
        orientation: deserializeStoredOrientation(record.response),
      }
    }

    const [created] = await transaction
      .insert(orientation)
      .values(normalizeOrientationFields(fields))
      .returning()
    const response = serializeStoredOrientation(created)
    await transaction
      .update(maintenanceIdempotency)
      .set({ response })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "orientation.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )

    return { status: "created", orientation: created }
  })
}

export function replaceOrientation(
  input: Parameters<typeof replaceOrientationWithDatabase>[1]
) {
  return replaceOrientationWithDatabase(db, input)
}

export async function replaceOrientationWithDatabase(
  database: typeof databaseClient,
  {
    id,
    expectedVersion,
    ...fields
  }: VersionedOrientationInput & OrientationFields
): Promise<ReplaceOrientationResult> {
  const updated = takeFirstOrNull(
    await database
      .update(orientation)
      .set({
        ...normalizeOrientationFields(fields),
        updatedAt: new Date(),
        version: sql`${orientation.version} + 1`,
      })
      .where(
        and(eq(orientation.id, id), eq(orientation.version, expectedVersion))
      )
      .returning()
  )
  if (updated !== null) return { status: "updated", orientation: updated }

  return classifyFailedVersionMutation(database, id)
}

export function deleteOrientationIfVersion(
  input: Parameters<typeof deleteOrientationIfVersionWithDatabase>[1]
) {
  return deleteOrientationIfVersionWithDatabase(db, input)
}

export async function deleteOrientationIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedOrientationInput
): Promise<DeleteOrientationIfVersionResult> {
  const deleted = takeFirstOrNull(
    await database
      .delete(orientation)
      .where(
        and(eq(orientation.id, id), eq(orientation.version, expectedVersion))
      )
      .returning()
  )
  if (deleted !== null) return { status: "deleted", orientation: deleted }

  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.orientation.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

function serializeStoredOrientation(record: Orientation): StoredOrientation {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeStoredOrientation(value: unknown): Orientation {
  const record = value as StoredOrientation
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
