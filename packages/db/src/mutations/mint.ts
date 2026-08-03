import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { mint } from "../schema/mint"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Mint } from "../schema/mint"

type MintFields = { code: string; name: string }
type UpdateMintInput = MintFields & { id: string }
type DeleteMintInput = { id: string }
type VersionedMintInput = { id: string; expectedVersion: number }

export type ReplaceMintResult =
  | { status: "updated"; mint: Mint }
  | { status: "missing" | "stale" }
export type DeleteMintIfVersionResult =
  | { status: "deleted"; mint: Mint }
  | { status: "missing" | "stale" }
export type CreateMintIdempotentlyResult =
  | { status: "created" | "replayed"; mint: Mint }
  | { status: "mismatch" }

function trimMintFields({ code, name }: MintFields) {
  return { code: code.trim(), name: name.trim() }
}

export async function createMint(fields: MintFields): Promise<Mint> {
  const [createdMint] = await db
    .insert(mint)
    .values(trimMintFields(fields))
    .returning()
  return createdMint
}

export async function updateMint({
  id,
  ...fields
}: UpdateMintInput): Promise<Mint | null> {
  return (
    (
      await db
        .update(mint)
        .set({ ...trimMintFields(fields), updatedAt: new Date() })
        .where(eq(mint.id, id))
        .returning()
    ).at(0) ?? null
  )
}

export async function deleteMint({
  id,
}: DeleteMintInput): Promise<Mint | null> {
  return (
    (await db.delete(mint).where(eq(mint.id, id)).returning()).at(0) ?? null
  )
}

export function createMintIdempotently(
  input: Parameters<typeof createMintIdempotentlyWithDatabase>[1]
) {
  return createMintIdempotentlyWithDatabase(db, input)
}

export async function createMintIdempotentlyWithDatabase(
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
    fields: MintFields
  }
): Promise<CreateMintIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "mint.create",
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
            eq(entry.operation, "mint.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return {
        status: "replayed",
        mint: deserializeMint(record.response),
      }
    }
    const [created] = await transaction
      .insert(mint)
      .values(trimMintFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeMint(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "mint.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", mint: created }
  })
}

export async function replaceMintWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedMintInput & MintFields
): Promise<ReplaceMintResult> {
  const updated = (
    await database
      .update(mint)
      .set({
        ...trimMintFields(fields),
        updatedAt: new Date(),
        version: sql`${mint.version} + 1`,
      })
      .where(and(eq(mint.id, id), eq(mint.version, expectedVersion)))
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", mint: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteMintIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedMintInput
): Promise<DeleteMintIfVersionResult> {
  const deleted = (
    await database
      .delete(mint)
      .where(and(eq(mint.id, id), eq(mint.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", mint: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.mint.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredMint = Omit<Mint, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeMint(record: Mint): StoredMint {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeMint(value: unknown): Mint {
  const record = value as StoredMint
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
