import { and, eq, isNull } from "drizzle-orm"

import type { db as databaseClient } from "../client"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"

const collectorId = "surface-image-upload"
const operation = "surface-image.consume"

export async function claimSurfaceImageUploadWithDatabase(
  database: typeof databaseClient,
  input: {
    claimToken: string
    referenceHash: string
    expiresAt: Date
  }
) {
  const claimed = await database
    .insert(maintenanceIdempotency)
    .values({
      collectorId,
      operation,
      key: input.referenceHash,
      requestHash: input.claimToken,
      expiresAt: input.expiresAt,
    })
    .onConflictDoNothing()
    .returning()
  return claimed.length === 1
}

export async function releaseSurfaceImageUploadClaimWithDatabase(
  database: typeof databaseClient,
  input: { claimToken: string; referenceHash: string }
) {
  await database
    .delete(maintenanceIdempotency)
    .where(
      and(
        eq(maintenanceIdempotency.collectorId, collectorId),
        eq(maintenanceIdempotency.operation, operation),
        eq(maintenanceIdempotency.key, input.referenceHash),
        eq(maintenanceIdempotency.requestHash, input.claimToken)
      )
    )
}

export async function releaseCoinCreateResourcesWithDatabase(
  database: typeof databaseClient,
  input: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    uploadClaims: Array<{ claimToken: string; referenceHash: string }>
  }
) {
  return database.transaction(async (transaction) => {
    const releasedReservation = await transaction
      .delete(maintenanceIdempotency)
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, input.collectorId),
          eq(maintenanceIdempotency.operation, "coin.create"),
          eq(maintenanceIdempotency.key, input.idempotencyKey),
          eq(maintenanceIdempotency.requestHash, input.requestHash),
          isNull(maintenanceIdempotency.response)
        )
      )
      .returning()
    if (releasedReservation.length === 0) return false
    for (const claim of input.uploadClaims) {
      await transaction
        .delete(maintenanceIdempotency)
        .where(
          and(
            eq(maintenanceIdempotency.collectorId, collectorId),
            eq(maintenanceIdempotency.operation, operation),
            eq(maintenanceIdempotency.key, claim.referenceHash),
            eq(maintenanceIdempotency.requestHash, claim.claimToken)
          )
        )
    }
    return true
  })
}
