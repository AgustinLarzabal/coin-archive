import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { edge } from "../schema/edge"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Edge } from "../schema/edge"

type EdgeFields = { code: string; name: string }
type UpdateEdgeInput = EdgeFields & { id: string }
type DeleteEdgeInput = { id: string }
type VersionedEdgeInput = { id: string; expectedVersion: number }

export type ReplaceEdgeResult =
  | { status: "updated"; edge: Edge }
  | { status: "missing" | "stale" }
export type DeleteEdgeIfVersionResult =
  | { status: "deleted"; edge: Edge }
  | { status: "missing" | "stale" }
export type CreateEdgeIdempotentlyResult =
  | { status: "created" | "replayed"; edge: Edge }
  | { status: "mismatch" }

function trimEdgeFields({ code, name }: EdgeFields) {
  return { code: code.trim(), name: name.trim() }
}

export async function createEdge(fields: EdgeFields): Promise<Edge> {
  const [createdEdge] = await db
    .insert(edge)
    .values(trimEdgeFields(fields))
    .returning()
  return createdEdge
}

export async function updateEdge({
  id,
  ...fields
}: UpdateEdgeInput): Promise<Edge | null> {
  return (
    await db
      .update(edge)
      .set({ ...trimEdgeFields(fields), updatedAt: new Date() })
      .where(eq(edge.id, id))
      .returning()
  ).at(0) ?? null
}

export async function deleteEdge({ id }: DeleteEdgeInput): Promise<Edge | null> {
  return (
    (await db.delete(edge).where(eq(edge.id, id)).returning()).at(0) ?? null
  )
}

export function createEdgeIdempotently(
  input: Parameters<typeof createEdgeIdempotentlyWithDatabase>[1]
) {
  return createEdgeIdempotentlyWithDatabase(db, input)
}

export async function createEdgeIdempotentlyWithDatabase(
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
    fields: EdgeFields
  }
): Promise<CreateEdgeIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "edge.create",
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
            eq(entry.operation, "edge.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return { status: "replayed", edge: deserializeEdge(record.response) }
    }
    const [created] = await transaction
      .insert(edge)
      .values(trimEdgeFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeEdge(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "edge.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", edge: created }
  })
}

export async function replaceEdgeWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedEdgeInput & EdgeFields
): Promise<ReplaceEdgeResult> {
  const updated = (
    await database
      .update(edge)
      .set({
        ...trimEdgeFields(fields),
        updatedAt: new Date(),
        version: sql`${edge.version} + 1`,
      })
      .where(and(eq(edge.id, id), eq(edge.version, expectedVersion)))
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", edge: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteEdgeIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedEdgeInput
): Promise<DeleteEdgeIfVersionResult> {
  const deleted = (
    await database
      .delete(edge)
      .where(and(eq(edge.id, id), eq(edge.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", edge: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.edge.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredEdge = Omit<Edge, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeEdge(record: Edge): StoredEdge {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeEdge(value: unknown): Edge {
  const record = value as StoredEdge
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
