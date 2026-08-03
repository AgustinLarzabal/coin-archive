import { and, eq, lte } from "drizzle-orm"

import type { createDatabase } from "../database"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"

type Database = ReturnType<typeof createDatabase>["db"]
type Authorization = {
  reference: string
  uploadUrl: string
  expiresAt: Date
}

export async function authorizeSurfaceImageUploadIdempotentlyWithDatabase(
  database: Database,
  {
    collectorId,
    idempotencyKey,
    requestHash,
    expiresAt,
  }: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    expiresAt: Date
  },
  authorize: () => Promise<Authorization>
): Promise<
  | { status: "created" | "replayed"; authorization: Authorization }
  | { status: "mismatch" }
> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))

    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "surface-image-upload.authorize",
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
        where: (entry, { and: all, eq: equal }) =>
          all(
            equal(entry.collectorId, collectorId),
            equal(entry.operation, "surface-image-upload.authorize"),
            equal(entry.key, idempotencyKey)
          ),
      }))

    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return {
        status: "replayed",
        authorization: deserializeAuthorization(record.response),
      }
    }

    const authorization = await authorize()
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeAuthorization(authorization) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(
            maintenanceIdempotency.operation,
            "surface-image-upload.authorize"
          ),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )

    return { status: "created", authorization }
  })
}

function serializeAuthorization(authorization: Authorization) {
  return { ...authorization, expiresAt: authorization.expiresAt.toISOString() }
}

function deserializeAuthorization(value: unknown): Authorization {
  if (typeof value !== "object" || value === null) throw new Error()
  const stored = value as Record<string, unknown>
  if (
    typeof stored.reference !== "string" ||
    typeof stored.uploadUrl !== "string" ||
    typeof stored.expiresAt !== "string"
  ) {
    throw new Error()
  }
  return {
    reference: stored.reference,
    uploadUrl: stored.uploadUrl,
    expiresAt: new Date(stored.expiresAt),
  }
}
