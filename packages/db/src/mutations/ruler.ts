import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import { ruler } from "../schema/ruler"
import type { Ruler } from "../schema/ruler"

type RulerFields = {
  code: string
  name: string
  rulerGroupId?: string | null
}

type UpdateRulerInput = RulerFields & {
  id: string
}

type DeleteRulerInput = {
  id: string
}

type VersionedRulerInput = { id: string; expectedVersion: number }

type RulerGroupReference = {
  id: string
  code: string
  name: string
}

export type RulerMutationRecord = Ruler & {
  group: RulerGroupReference | null
}

export type ReplaceRulerResult =
  | { status: "updated"; ruler: RulerMutationRecord }
  | { status: "missing" | "stale" }
export type DeleteRulerIfVersionResult =
  | { status: "deleted"; ruler: Ruler }
  | { status: "missing" | "stale" }
export type CreateRulerIdempotentlyResult =
  | { status: "created" | "replayed"; ruler: RulerMutationRecord }
  | { status: "mismatch" }

function normalizeRulerGroupId(rulerGroupId: string | null | undefined) {
  const normalizedRulerGroupId = rulerGroupId?.trim()

  if (!normalizedRulerGroupId) {
    return null
  }

  return normalizedRulerGroupId
}

function normalizeRulerFields({ code, name, rulerGroupId }: RulerFields) {
  return {
    code: code.trim(),
    name: name.trim(),
    rulerGroupId: normalizeRulerGroupId(rulerGroupId),
  }
}

export async function createRuler(fields: RulerFields): Promise<Ruler> {
  const [createdRuler] = await db
    .insert(ruler)
    .values(normalizeRulerFields(fields))
    .returning()

  return createdRuler
}

export async function updateRuler({
  id,
  ...fields
}: UpdateRulerInput): Promise<Ruler | null> {
  const updatedRuler = (
    await db
      .update(ruler)
      .set({
        ...normalizeRulerFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(ruler.id, id))
      .returning()
  ).at(0)

  return updatedRuler ?? null
}

export async function deleteRuler({
  id,
}: DeleteRulerInput): Promise<Ruler | null> {
  const deletedRuler = (
    await db.delete(ruler).where(eq(ruler.id, id)).returning()
  ).at(0)

  return deletedRuler ?? null
}

export function createRulerIdempotently(
  input: Parameters<typeof createRulerIdempotentlyWithDatabase>[1]
) {
  return createRulerIdempotentlyWithDatabase(db, input)
}

export async function createRulerIdempotentlyWithDatabase(
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
    fields: RulerFields
  }
): Promise<CreateRulerIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "ruler.create",
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
            eq(entry.operation, "ruler.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return {
        status: "replayed",
        ruler: deserializeRulerMutationRecord(record.response),
      }
    }
    const [created] = await transaction
      .insert(ruler)
      .values(normalizeRulerFields(fields))
      .returning()
    const group =
      created.rulerGroupId === null
        ? null
        : ((await transaction.query.rulerGroup.findFirst({
            columns: { id: true, code: true, name: true },
            where: (record, { eq }) => eq(record.id, created.rulerGroupId!),
          })) ?? null)
    const createdRecord: RulerMutationRecord = { ...created, group }
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeRulerMutationRecord(createdRecord) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "ruler.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", ruler: createdRecord }
  })
}

export async function replaceRulerWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedRulerInput & RulerFields
): Promise<ReplaceRulerResult> {
  return database.transaction(async (transaction) => {
    const updated = (
      await transaction
        .update(ruler)
        .set({
          ...normalizeRulerFields(fields),
          updatedAt: new Date(),
          version: sql`${ruler.version} + 1`,
        })
        .where(and(eq(ruler.id, id), eq(ruler.version, expectedVersion)))
        .returning()
    ).at(0)
    if (updated === undefined) {
      const exists = await transaction.query.ruler.findFirst({
        columns: { id: true },
        where: (record, { eq }) => eq(record.id, id),
      })
      return { status: exists === undefined ? "missing" : "stale" }
    }
    const group =
      updated.rulerGroupId === null
        ? null
        : ((await transaction.query.rulerGroup.findFirst({
            columns: { id: true, code: true, name: true },
            where: (record, { eq }) => eq(record.id, updated.rulerGroupId!),
          })) ?? null)
    return {
      status: "updated",
      ruler: { ...updated, group },
    }
  })
}

export async function deleteRulerIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedRulerInput
): Promise<DeleteRulerIfVersionResult> {
  const deleted = (
    await database
      .delete(ruler)
      .where(and(eq(ruler.id, id), eq(ruler.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", ruler: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.ruler.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredRulerMutationRecord = Omit<
  RulerMutationRecord,
  "createdAt" | "updatedAt"
> & {
  createdAt: string
  updatedAt: string
}

function serializeRulerMutationRecord(
  record: RulerMutationRecord
): StoredRulerMutationRecord {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeRulerMutationRecord(value: unknown): RulerMutationRecord {
  const record = value as StoredRulerMutationRecord
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
