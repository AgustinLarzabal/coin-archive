import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import { issuer } from "../schema/issuer"
import type { Issuer } from "../schema/issuer"

type IssuerFields = {
  code: string
  isoCode: string
  name: string
  parentIssuerId: string | null
}

type UpdateIssuerInput = IssuerFields & {
  id: string
}

type DeleteIssuerInput = {
  id: string
}

type VersionedIssuerInput = {
  id: string
  expectedVersion: number
}

export type ReplaceIssuerResult =
  | { status: "updated"; issuer: Issuer }
  | { status: "missing" | "stale" }
export type DeleteIssuerIfVersionResult =
  | { status: "deleted"; issuer: Issuer }
  | { status: "missing" | "stale" }
export type CreateIssuerIdempotentlyResult =
  | { status: "created" | "replayed"; issuer: Issuer }
  | { status: "mismatch" }

function normalizeParentIssuerId(parentIssuerId: string | null) {
  const normalizedParentIssuerId = parentIssuerId?.trim()

  if (
    normalizedParentIssuerId === undefined ||
    normalizedParentIssuerId.length === 0
  ) {
    return null
  }

  return normalizedParentIssuerId
}

function normalizeIssuerFields({
  code,
  isoCode,
  name,
  parentIssuerId,
}: IssuerFields) {
  return {
    code: code.trim(),
    isoCode: isoCode.trim().toUpperCase(),
    name: name.trim(),
    parentIssuerId: normalizeParentIssuerId(parentIssuerId),
  }
}

export async function createIssuer(fields: IssuerFields): Promise<Issuer> {
  const [createdIssuer] = await db
    .insert(issuer)
    .values(normalizeIssuerFields(fields))
    .returning()

  return createdIssuer
}

export async function updateIssuer({
  id,
  ...fields
}: UpdateIssuerInput): Promise<Issuer | null> {
  const updatedIssuer = (
    await db
      .update(issuer)
      .set({
        ...normalizeIssuerFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(issuer.id, id))
      .returning()
  ).at(0)

  return updatedIssuer ?? null
}

export async function deleteIssuer({
  id,
}: DeleteIssuerInput): Promise<Issuer | null> {
  const deletedIssuer = (
    await db.delete(issuer).where(eq(issuer.id, id)).returning()
  ).at(0)

  return deletedIssuer ?? null
}

export function createIssuerIdempotently(
  input: Parameters<typeof createIssuerIdempotentlyWithDatabase>[1]
) {
  return createIssuerIdempotentlyWithDatabase(db, input)
}

export async function createIssuerIdempotentlyWithDatabase(
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
    fields: IssuerFields
  }
): Promise<CreateIssuerIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "issuer.create",
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
            eq(entry.operation, "issuer.create"),
            eq(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return { status: "replayed", issuer: deserializeIssuer(record.response) }
    }
    const [created] = await transaction
      .insert(issuer)
      .values(normalizeIssuerFields(fields))
      .returning()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeIssuer(created) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "issuer.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", issuer: created }
  })
}

export async function replaceIssuerWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion, ...fields }: VersionedIssuerInput & IssuerFields
): Promise<ReplaceIssuerResult> {
  const updated = (
    await database
      .update(issuer)
      .set({
        ...normalizeIssuerFields(fields),
        updatedAt: new Date(),
        version: sql`${issuer.version} + 1`,
      })
      .where(and(eq(issuer.id, id), eq(issuer.version, expectedVersion)))
      .returning()
  ).at(0)
  if (updated !== undefined) return { status: "updated", issuer: updated }
  return classifyFailedVersionMutation(database, id)
}

export async function deleteIssuerIfVersionWithDatabase(
  database: typeof databaseClient,
  { id, expectedVersion }: VersionedIssuerInput
): Promise<DeleteIssuerIfVersionResult> {
  const deleted = (
    await database
      .delete(issuer)
      .where(and(eq(issuer.id, id), eq(issuer.version, expectedVersion)))
      .returning()
  ).at(0)
  if (deleted !== undefined) return { status: "deleted", issuer: deleted }
  return classifyFailedVersionMutation(database, id)
}

async function classifyFailedVersionMutation(
  database: typeof databaseClient,
  id: string
): Promise<{ status: "missing" | "stale" }> {
  const exists = await database.query.issuer.findFirst({
    columns: { id: true },
    where: (record, { eq }) => eq(record.id, id),
  })
  return { status: exists === undefined ? "missing" : "stale" }
}

type StoredIssuer = Omit<Issuer, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function serializeIssuer(record: Issuer): StoredIssuer {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeIssuer(value: unknown): Issuer {
  const record = value as StoredIssuer
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}
