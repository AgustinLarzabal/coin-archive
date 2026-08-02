import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { currency } from "../schema/currency"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Currency } from "../schema/currency"

type CurrencyFields = {
  code: string
  name: string
  fullName: string
}

type UpdateCurrencyInput = CurrencyFields & { id: string }
type DeleteCurrencyInput = { id: string }
type VersionedCurrencyInput = { id: string; expectedVersion: number }

export type ReplaceCurrencyResult =
  | { status: "updated"; currency: Currency }
  | { status: "missing" | "stale" }
export type DeleteCurrencyIfVersionResult =
  | { status: "deleted"; currency: Currency }
  | { status: "missing" | "stale" }
export type CreateCurrencyIdempotentlyResult =
  | { status: "created" | "replayed"; currency: Currency }
  | { status: "mismatch" }

function trimCurrencyFields({ code, name, fullName }: CurrencyFields) {
  return { code: code.trim(), name: name.trim(), fullName: fullName.trim() }
}

export async function createCurrency(
  fields: CurrencyFields
): Promise<Currency> {
  const [createdCurrency] = await db
    .insert(currency)
    .values(trimCurrencyFields(fields))
    .returning()
  return createdCurrency
}

export async function updateCurrency({
  id,
  ...fields
}: UpdateCurrencyInput): Promise<Currency | null> {
  const updatedCurrency = (
    await db
      .update(currency)
      .set({ ...trimCurrencyFields(fields), updatedAt: new Date() })
      .where(eq(currency.id, id))
      .returning()
  ).at(0)
  return updatedCurrency ?? null
}

export async function deleteCurrency({
  id,
}: DeleteCurrencyInput): Promise<Currency | null> {
  return (
    (await db.delete(currency).where(eq(currency.id, id)).returning()).at(0) ??
    null
  )
}

export function createCurrencyIdempotently(
  input: Parameters<typeof createCurrencyIdempotentlyWithDatabase>[1]
) {
  return createCurrencyIdempotentlyWithDatabase(db, input)
}

export async function createCurrencyIdempotentlyWithDatabase(
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
    fields: CurrencyFields
  }
): Promise<CreateCurrencyIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "currency.create",
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
            eq(entry.operation, "currency.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return {
        status: "replayed",
        currency: deserializeCurrency(record.response),
      }
    }
    const [created] = await transaction
      .insert(currency)
      .values(trimCurrencyFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeCurrency(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "currency.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", currency: created }
  })
}

export async function replaceCurrencyWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedCurrencyInput & CurrencyFields
): Promise<ReplaceCurrencyResult> {
  const updated = (
    await database
      .update(currency)
      .set({
        ...trimCurrencyFields(fields),
        updatedAt: new Date(),
        version: sql`${currency.version} + 1`,
      })
      .where(and(eq(currency.id, id), eq(currency.version, expectedVersion)))
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", currency: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteCurrencyIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedCurrencyInput
): Promise<DeleteCurrencyIfVersionResult> {
  const deleted = (
    await database
      .delete(currency)
      .where(and(eq(currency.id, id), eq(currency.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", currency: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.currency.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredCurrency = Omit<Currency, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeCurrency(record: Currency): StoredCurrency {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeCurrency(value: unknown): Currency {
  const record = value as StoredCurrency
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
