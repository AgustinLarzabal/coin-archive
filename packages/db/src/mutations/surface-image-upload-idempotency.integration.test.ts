import { describe, expect, it, vi } from "vitest"
import { and, eq } from "drizzle-orm"

import { db } from "../index"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import { authorizeSurfaceImageUploadIdempotentlyWithDatabase } from "./surface-image-upload-idempotency"
import {
  claimSurfaceImageUploadWithDatabase,
  releaseCoinCreateResourcesWithDatabase,
  releaseSurfaceImageUploadClaimWithDatabase,
} from "./surface-image-upload-consumption"
import { reserveCoinMaintenanceCreateWithDatabase } from "./coin-maintenance"

const input = {
  collectorId: "surface-image-editor",
  idempotencyKey: "upload-attempt-1",
  requestHash: "request-hash",
  expiresAt: new Date("2099-08-03T10:05:00.000Z"),
}

describe("Surface Image upload authorization idempotency", () => {
  useTestDatabaseIsolation(db)

  it("replays the original sensitive authorization without signing twice", async () => {
    const authorize = vi.fn(async () => ({
      reference: "opaque-upload-reference",
      uploadUrl: "https://r2.example.test/presigned",
      expiresAt: new Date("2099-08-03T10:05:00.000Z"),
    }))

    const first = await authorizeSurfaceImageUploadIdempotentlyWithDatabase(
      db,
      input,
      authorize
    )
    const replay = await authorizeSurfaceImageUploadIdempotentlyWithDatabase(
      db,
      input,
      authorize
    )

    expect(first).toStrictEqual({
      status: "created",
      authorization: await authorize.mock.results[0].value,
    })
    expect(replay).toStrictEqual({
      status: "replayed",
      authorization: await authorize.mock.results[0].value,
    })
    expect(authorize).toHaveBeenCalledTimes(1)
  })

  it("rejects reuse with different upload metadata", async () => {
    const authorize = vi.fn(async () => ({
      reference: "opaque-upload-reference",
      uploadUrl: "https://r2.example.test/presigned",
      expiresAt: new Date("2099-08-03T10:05:00.000Z"),
    }))
    await authorizeSurfaceImageUploadIdempotentlyWithDatabase(
      db,
      input,
      authorize
    )

    await expect(
      authorizeSurfaceImageUploadIdempotentlyWithDatabase(
        db,
        { ...input, requestHash: "different-request-hash" },
        authorize
      )
    ).resolves.toStrictEqual({ status: "mismatch" })
    expect(authorize).toHaveBeenCalledTimes(1)
  })

  it("allows only one consumer to claim an opaque upload reference", async () => {
    const claim = {
      claimToken: "claim-1",
      referenceHash: "a".repeat(64),
      expiresAt: new Date("2099-08-03T10:05:00.000Z"),
    }

    await expect(claimSurfaceImageUploadWithDatabase(db, claim)).resolves.toBe(
      true
    )
    await expect(
      claimSurfaceImageUploadWithDatabase(db, {
        ...claim,
        claimToken: "claim-2",
      })
    ).resolves.toBe(false)
    await releaseSurfaceImageUploadClaimWithDatabase(db, claim)
    await expect(
      claimSurfaceImageUploadWithDatabase(db, {
        ...claim,
        claimToken: "claim-2",
      })
    ).resolves.toBe(true)
  })

  it("atomically releases a failed Coin reservation and its upload claims", async () => {
    const reservation = {
      collectorId: "editor",
      idempotencyKey: "failed-create",
      requestHash: "c".repeat(64),
      expiresAt: new Date("2099-08-03T10:05:00.000Z"),
    }
    const claim = {
      claimToken: "claim-for-failed-create",
      referenceHash: "d".repeat(64),
      expiresAt: reservation.expiresAt,
    }
    await reserveCoinMaintenanceCreateWithDatabase(db, reservation)
    await claimSurfaceImageUploadWithDatabase(db, claim)

    await releaseCoinCreateResourcesWithDatabase(db, {
      ...reservation,
      uploadClaims: [claim],
    })

    await expect(
      reserveCoinMaintenanceCreateWithDatabase(db, reservation)
    ).resolves.toStrictEqual({ status: "reserved" })
    await expect(
      claimSurfaceImageUploadWithDatabase(db, {
        ...claim,
        claimToken: "retry-claim",
      })
    ).resolves.toBe(true)
  })

  it("does not release claims when the Coin reservation already completed", async () => {
    const reservation = {
      collectorId: "editor",
      idempotencyKey: "completed-create",
      requestHash: "e".repeat(64),
      expiresAt: new Date("2099-08-03T10:05:00.000Z"),
    }
    const claim = {
      claimToken: "completed-claim",
      referenceHash: "f".repeat(64),
      expiresAt: reservation.expiresAt,
    }
    await reserveCoinMaintenanceCreateWithDatabase(db, reservation)
    await claimSurfaceImageUploadWithDatabase(db, claim)
    await db
      .update(maintenanceIdempotency)
      .set({ response: { id: "completed" } })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, reservation.collectorId),
          eq(maintenanceIdempotency.operation, "coin.create"),
          eq(maintenanceIdempotency.key, reservation.idempotencyKey)
        )
      )

    await expect(
      releaseCoinCreateResourcesWithDatabase(db, {
        ...reservation,
        uploadClaims: [claim],
      })
    ).resolves.toBe(false)
    await expect(
      claimSurfaceImageUploadWithDatabase(db, {
        ...claim,
        claimToken: "competing-claim",
      })
    ).resolves.toBe(false)
  })
})
