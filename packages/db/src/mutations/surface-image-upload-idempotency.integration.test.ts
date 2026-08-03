import { describe, expect, it, vi } from "vitest"

import { db } from "../index"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { authorizeSurfaceImageUploadIdempotentlyWithDatabase } from "./surface-image-upload-idempotency"

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
})
