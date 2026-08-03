import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { shape } from "../schema/shape"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Shape } from "../schema/shape"

type ShapeFields = { code: string; name: string }
type UpdateShapeInput = ShapeFields & { id: string }
type DeleteShapeInput = { id: string }
type VersionedShapeInput = { id: string; expectedVersion: number }

export type ReplaceShapeResult =
  | { status: "updated"; shape: Shape }
  | { status: "missing" | "stale" }
export type DeleteShapeIfVersionResult =
  | { status: "deleted"; shape: Shape }
  | { status: "missing" | "stale" }
export type CreateShapeIdempotentlyResult =
  | { status: "created" | "replayed"; shape: Shape }
  | { status: "mismatch" }

function trimShapeFields({ code, name }: ShapeFields) {
  return { code: code.trim(), name: name.trim() }
}

export async function createShape(fields: ShapeFields): Promise<Shape> {
  const [createdShape] = await db
    .insert(shape)
    .values(trimShapeFields(fields))
    .returning()
  return createdShape
}

export async function updateShape({
  id,
  ...fields
}: UpdateShapeInput): Promise<Shape | null> {
  return (
    await db
      .update(shape)
      .set({ ...trimShapeFields(fields), updatedAt: new Date() })
      .where(eq(shape.id, id))
      .returning()
  ).at(0) ?? null
}

export async function deleteShape({ id }: DeleteShapeInput): Promise<Shape | null> {
  return (
    (await db.delete(shape).where(eq(shape.id, id)).returning()).at(0) ?? null
  )
}

export function createShapeIdempotently(
  input: Parameters<typeof createShapeIdempotentlyWithDatabase>[1]
) {
  return createShapeIdempotentlyWithDatabase(db, input)
}

export async function createShapeIdempotentlyWithDatabase(
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
    fields: ShapeFields
  }
): Promise<CreateShapeIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "shape.create",
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
            eq(entry.operation, "shape.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return { status: "replayed", shape: deserializeShape(record.response) }
    }
    const [created] = await transaction
      .insert(shape)
      .values(trimShapeFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeShape(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "shape.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", shape: created }
  })
}

export async function replaceShapeWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedShapeInput & ShapeFields
): Promise<ReplaceShapeResult> {
  const updated = (
    await database
      .update(shape)
      .set({
        ...trimShapeFields(fields),
        updatedAt: new Date(),
        version: sql`${shape.version} + 1`,
      })
      .where(and(eq(shape.id, id), eq(shape.version, expectedVersion)))
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", shape: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteShapeIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedShapeInput
): Promise<DeleteShapeIfVersionResult> {
  const deleted = (
    await database
      .delete(shape)
      .where(and(eq(shape.id, id), eq(shape.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", shape: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.shape.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredShape = Omit<Shape, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeShape(record: Shape): StoredShape {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeShape(value: unknown): Shape {
  const record = value as StoredShape
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
