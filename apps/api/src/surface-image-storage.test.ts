import { describe, expect, it, vi } from "vitest"

import {
  SURFACE_IMAGE_UPLOAD_EXPIRES_IN_SECONDS,
  createR2SurfaceImageUploadStorage,
} from "./surface-image-storage"
import type { SurfaceImageUploadObjectStorage } from "./surface-image-storage"

const configuration = {
  endpoint: "https://account-id.r2.cloudflarestorage.com",
  bucket: "coin-images",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
}

describe("API-owned temporary Surface Image storage", () => {
  it("creates a five-minute direct PUT authorization under the temporary prefix", async () => {
    const objectStorage: SurfaceImageUploadObjectStorage = {
      createPresignedPutUrl: vi
        .fn()
        .mockResolvedValue("https://r2.example.test/direct-put"),
      deleteObject: vi.fn(),
    }
    const now = new Date("2026-08-03T10:00:00.000Z")
    const storage = createR2SurfaceImageUploadStorage(
      configuration,
      objectStorage,
      { now: () => now.getTime(), createObjectId: () => "opaque-id" }
    )

    const result = await storage.authorizeUpload({
      surface: "obverse",
      contentType: "image/png",
      contentLength: 1024,
    })

    expect(result).toMatchObject({
      reference: expect.any(String),
      uploadUrl: "https://r2.example.test/direct-put",
      expiresAt: new Date(
        now.getTime() + SURFACE_IMAGE_UPLOAD_EXPIRES_IN_SECONDS * 1000
      ),
    })
    expect(objectStorage.createPresignedPutUrl).toHaveBeenCalledWith({
      objectKey: "surface-images/temporary/opaque-id",
      contentType: "image/png",
    })
  })

  it("cancels only the temporary object identified by a valid Surface reference", async () => {
    const objectStorage: SurfaceImageUploadObjectStorage = {
      createPresignedPutUrl: vi.fn().mockResolvedValue("https://r2.test/put"),
      deleteObject: vi.fn(),
    }
    const storage = createR2SurfaceImageUploadStorage(
      configuration,
      objectStorage,
      { createObjectId: () => "opaque-id" }
    )
    const authorization = await storage.authorizeUpload({
      surface: "edge",
      contentType: "image/webp",
      contentLength: 12,
    })

    await storage.cancelUpload(authorization.reference, "edge")

    expect(objectStorage.deleteObject).toHaveBeenCalledWith(
      "surface-images/temporary/opaque-id"
    )
    await expect(
      storage.cancelUpload(authorization.reference, "reverse")
    ).rejects.toThrow("not authorized for this Surface")
  })

  it("rejects invalid, expired, unsupported, empty, and oversized uploads", async () => {
    const objectStorage: SurfaceImageUploadObjectStorage = {
      createPresignedPutUrl: vi.fn().mockResolvedValue("https://r2.test/put"),
      deleteObject: vi.fn(),
    }
    let currentTime = Date.parse("2026-08-03T10:00:00.000Z")
    const storage = createR2SurfaceImageUploadStorage(
      configuration,
      objectStorage,
      { now: () => currentTime }
    )

    for (const upload of [
      {
        surface: "obverse" as const,
        contentType: "image/gif",
        contentLength: 1,
      },
      {
        surface: "reverse" as const,
        contentType: "image/png",
        contentLength: 0,
      },
      {
        surface: "edge" as const,
        contentType: "image/webp",
        contentLength: 10 * 1024 * 1024 + 1,
      },
    ]) {
      await expect(storage.authorizeUpload(upload)).rejects.toThrow()
    }

    const authorization = await storage.authorizeUpload({
      surface: "obverse",
      contentType: "image/jpeg",
      contentLength: 3,
    })
    currentTime += 5 * 60 * 1000 + 1
    await expect(
      storage.cancelUpload(authorization.reference, "obverse")
    ).rejects.toThrow("has expired")
    await expect(
      storage.cancelUpload("not-a-reference", "obverse")
    ).rejects.toThrow("reference is invalid")
  })
})
