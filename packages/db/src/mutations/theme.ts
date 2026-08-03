import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { theme } from "../schema/theme"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Theme } from "../schema/theme"

type ThemeFields = { code: string; name: string }
type UpdateThemeInput = ThemeFields & { id: string }
type DeleteThemeInput = { id: string }
type VersionedThemeInput = { id: string; expectedVersion: number }

export type ReplaceThemeResult =
  | { status: "updated"; theme: Theme }
  | { status: "missing" | "stale" }
export type DeleteThemeIfVersionResult =
  | { status: "deleted"; theme: Theme }
  | { status: "missing" | "stale" }
export type CreateThemeIdempotentlyResult =
  | { status: "created" | "replayed"; theme: Theme }
  | { status: "mismatch" }

function trimThemeFields({ code, name }: ThemeFields) {
  return { code: code.trim(), name: name.trim() }
}

export async function createTheme(fields: ThemeFields): Promise<Theme> {
  const [createdTheme] = await db
    .insert(theme)
    .values(trimThemeFields(fields))
    .returning()
  return createdTheme
}

export async function updateTheme({
  id,
  ...fields
}: UpdateThemeInput): Promise<Theme | null> {
  return (
    await db
      .update(theme)
      .set({ ...trimThemeFields(fields), updatedAt: new Date() })
      .where(eq(theme.id, id))
      .returning()
  ).at(0) ?? null
}

export async function deleteTheme({ id }: DeleteThemeInput): Promise<Theme | null> {
  return (
    (await db.delete(theme).where(eq(theme.id, id)).returning()).at(0) ?? null
  )
}

export function createThemeIdempotently(
  input: Parameters<typeof createThemeIdempotentlyWithDatabase>[1]
) {
  return createThemeIdempotentlyWithDatabase(db, input)
}

export async function createThemeIdempotentlyWithDatabase(
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
    fields: ThemeFields
  }
): Promise<CreateThemeIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "theme.create",
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
            eq(entry.operation, "theme.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return { status: "replayed", theme: deserializeTheme(record.response) }
    }
    const [created] = await transaction
      .insert(theme)
      .values(trimThemeFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeTheme(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "theme.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", theme: created }
  })
}

export async function replaceThemeWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedThemeInput & ThemeFields
): Promise<ReplaceThemeResult> {
  const updated = (
    await database
      .update(theme)
      .set({
        ...trimThemeFields(fields),
        updatedAt: new Date(),
        version: sql`${theme.version} + 1`,
      })
      .where(and(eq(theme.id, id), eq(theme.version, expectedVersion)))
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", theme: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteThemeIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedThemeInput
): Promise<DeleteThemeIfVersionResult> {
  const deleted = (
    await database
      .delete(theme)
      .where(and(eq(theme.id, id), eq(theme.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", theme: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.theme.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredTheme = Omit<Theme, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeTheme(record: Theme): StoredTheme {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeTheme(value: unknown): Theme {
  const record = value as StoredTheme
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
