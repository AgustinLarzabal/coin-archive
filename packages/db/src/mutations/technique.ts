import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { technique } from "../schema/technique"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Technique } from "../schema/technique"

type TechniqueFields = { code: string; name: string }
type UpdateTechniqueInput = TechniqueFields & { id: string }
type DeleteTechniqueInput = { id: string }
type VersionedTechniqueInput = { id: string; expectedVersion: number }

export type ReplaceTechniqueResult =
  | { status: "updated"; technique: Technique }
  | { status: "missing" | "stale" }
export type DeleteTechniqueIfVersionResult =
  | { status: "deleted"; technique: Technique }
  | { status: "missing" | "stale" }
export type CreateTechniqueIdempotentlyResult =
  | { status: "created" | "replayed"; technique: Technique }
  | { status: "mismatch" }

function trimTechniqueFields({ code, name }: TechniqueFields) {
  return { code: code.trim(), name: name.trim() }
}

export async function createTechnique(
  fields: TechniqueFields
): Promise<Technique> {
  const [createdTechnique] = await db
    .insert(technique)
    .values(trimTechniqueFields(fields))
    .returning()
  return createdTechnique
}

export async function updateTechnique({
  id,
  ...fields
}: UpdateTechniqueInput): Promise<Technique | null> {
  return (
    (
      await db
        .update(technique)
        .set({ ...trimTechniqueFields(fields), updatedAt: new Date() })
        .where(eq(technique.id, id))
        .returning()
    ).at(0) ?? null
  )
}

export async function deleteTechnique({
  id,
}: DeleteTechniqueInput): Promise<Technique | null> {
  return (
    (await db.delete(technique).where(eq(technique.id, id)).returning()).at(
      0
    ) ?? null
  )
}

export function createTechniqueIdempotently(
  input: Parameters<typeof createTechniqueIdempotentlyWithDatabase>[1]
) {
  return createTechniqueIdempotentlyWithDatabase(db, input)
}

export async function createTechniqueIdempotentlyWithDatabase(
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
    fields: TechniqueFields
  }
): Promise<CreateTechniqueIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "technique.create",
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
            eq(entry.operation, "technique.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return {
        status: "replayed",
        technique: deserializeTechnique(record.response),
      }
    }
    const [created] = await transaction
      .insert(technique)
      .values(trimTechniqueFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeTechnique(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "technique.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", technique: created }
  })
}

export async function replaceTechniqueWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedTechniqueInput & TechniqueFields
): Promise<ReplaceTechniqueResult> {
  const updated = (
    await database
      .update(technique)
      .set({
        ...trimTechniqueFields(fields),
        updatedAt: new Date(),
        version: sql`${technique.version} + 1`,
      })
      .where(and(eq(technique.id, id), eq(technique.version, expectedVersion)))
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", technique: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteTechniqueIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedTechniqueInput
): Promise<DeleteTechniqueIfVersionResult> {
  const deleted = (
    await database
      .delete(technique)
      .where(and(eq(technique.id, id), eq(technique.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", technique: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.technique.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredTechnique = Omit<Technique, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeTechnique(record: Technique): StoredTechnique {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeTechnique(value: unknown): Technique {
  const record = value as StoredTechnique
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
