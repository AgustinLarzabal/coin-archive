import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { catalogue } from "../schema/catalogue"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Catalogue } from "../schema/catalogue"

type CatalogueFields = {
  code: string
  title: string
}

type UpdateCatalogueInput = CatalogueFields & {
  id: string
}

type DeleteCatalogueInput = {
  id: string
}

type VersionedCatalogueInput = {
  id: string
  expectedVersion: number
}

export type ReplaceCatalogueResult =
  | { status: "updated"; catalogue: Catalogue }
  | { status: "missing" | "stale" }

export type DeleteCatalogueIfVersionResult =
  | { status: "deleted"; catalogue: Catalogue }
  | { status: "missing" | "stale" }

export type CreateCatalogueIdempotentlyResult =
  | { status: "created" | "replayed"; catalogue: Catalogue }
  | { status: "mismatch" }

function trimCatalogueFields({ code, title }: CatalogueFields) {
  return {
    code: code.trim(),
    title: title.trim(),
  }
}

export async function createCatalogue(
  fields: CatalogueFields
): Promise<Catalogue> {
  const [createdCatalogue] = await db
    .insert(catalogue)
    .values(trimCatalogueFields(fields))
    .returning()

  return createdCatalogue
}

export async function updateCatalogue({
  id,
  ...fields
}: UpdateCatalogueInput): Promise<Catalogue | null> {
  const updatedCatalogue = (
    await db
      .update(catalogue)
      .set({
        ...trimCatalogueFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(catalogue.id, id))
      .returning()
  ).at(0)

  if (!updatedCatalogue) {
    return null
  }

  return updatedCatalogue
}

export async function deleteCatalogue({
  id,
}: DeleteCatalogueInput): Promise<Catalogue | null> {
  const deletedCatalogue = (
    await db.delete(catalogue).where(eq(catalogue.id, id)).returning()
  ).at(0)

  if (!deletedCatalogue) {
    return null
  }

  return deletedCatalogue
}

export function createCatalogueIdempotently(
  input: Parameters<typeof createCatalogueIdempotentlyWithDatabase>[1]
) {
  return createCatalogueIdempotentlyWithDatabase(db, input)
}

export async function createCatalogueIdempotentlyWithDatabase(
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
    fields: CatalogueFields
  }
): Promise<CreateCatalogueIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "catalogue.create",
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
            eq(entry.operation, "catalogue.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return {
        status: "replayed",
        catalogue: deserializeCatalogue(record.response),
      }
    }
    const [created] = await transaction
      .insert(catalogue)
      .values(trimCatalogueFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeCatalogue(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "catalogue.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", catalogue: created }
  })
}

export async function replaceCatalogueWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedCatalogueInput & CatalogueFields
): Promise<ReplaceCatalogueResult> {
  const updated = (
    await database
      .update(catalogue)
      .set({
        ...trimCatalogueFields(fields),
        updatedAt: new Date(),
        version: sql`${catalogue.version} + 1`,
      })
      .where(and(eq(catalogue.id, id), eq(catalogue.version, expectedVersion)))
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", catalogue: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteCatalogueIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedCatalogueInput
): Promise<DeleteCatalogueIfVersionResult> {
  const deleted = (
    await database
      .delete(catalogue)
      .where(and(eq(catalogue.id, id), eq(catalogue.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", catalogue: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.catalogue.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredCatalogue = Omit<Catalogue, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeCatalogue(record: Catalogue): StoredCatalogue {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeCatalogue(value: unknown): Catalogue {
  const record = value as StoredCatalogue
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
