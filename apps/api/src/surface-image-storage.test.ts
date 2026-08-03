import { describe, expect, it, vi } from "vitest"

import {
  SURFACE_IMAGE_UPLOAD_EXPIRES_IN_SECONDS,
  SurfaceImageObjectNotFoundError,
  createR2SurfaceImageUploadStorage,
} from "./surface-image-storage"
import type { SurfaceImageUploadObjectStorage } from "./surface-image-storage"

const configuration = {
  endpoint: "https://account-id.r2.cloudflarestorage.com",
  bucket: "coin-images",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
  publicBaseUrl: "https://images.example.test",
}

describe("API-owned temporary Surface Image storage", () => {
  it("creates a five-minute direct PUT authorization under the temporary prefix", async () => {
    const objectStorage: SurfaceImageUploadObjectStorage = {
      createPresignedPutUrl: vi
        .fn()
        .mockResolvedValue("https://r2.example.test/direct-put"),
      deleteObject: vi.fn(),
      inspectObject: vi.fn(),
      copyObject: vi.fn(),
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
      inspectObject: vi.fn(),
      copyObject: vi.fn(),
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
      inspectObject: vi.fn(),
      copyObject: vi.fn(),
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

  it("verifies and copies an authorized temporary image, then finalizes it", async () => {
    const objectStorage: SurfaceImageUploadObjectStorage = {
      createPresignedPutUrl: vi.fn().mockResolvedValue("https://r2.test/put"),
      deleteObject: vi.fn(),
      inspectObject: vi.fn().mockResolvedValue({
        contentLength: 8,
        contentType: "image/png",
        firstBytes: Uint8Array.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ]),
      }),
      copyObject: vi.fn(),
    }
    const storage = createR2SurfaceImageUploadStorage(
      configuration,
      objectStorage,
      {
        createObjectId: () => "opaque-id",
      }
    )
    const authorization = await storage.authorizeUpload({
      surface: "reverse",
      contentType: "image/png",
      contentLength: 8,
    })

    await expect(
      storage.prepareUpload(authorization.reference, "reverse")
    ).resolves.toStrictEqual({
      imageUrl:
        "https://images.example.test/surface-images/published/opaque-id",
    })
    expect(objectStorage.inspectObject).toHaveBeenCalledWith(
      "surface-images/temporary/opaque-id"
    )
    expect(objectStorage.copyObject).toHaveBeenCalledWith(
      "surface-images/temporary/opaque-id",
      "surface-images/published/opaque-id"
    )
    expect(objectStorage.deleteObject).not.toHaveBeenCalled()

    await storage.finalizeUpload(authorization.reference, "reverse")
    expect(objectStorage.deleteObject).toHaveBeenCalledWith(
      "surface-images/temporary/opaque-id"
    )
  })

  it("rejects metadata mismatches and invalid image signatures without publishing", async () => {
    const inspectObject = vi
      .fn()
      .mockResolvedValueOnce({
        contentLength: 7,
        contentType: "image/png",
        firstBytes: new Uint8Array(8),
      })
      .mockResolvedValueOnce({
        contentLength: 8,
        contentType: "image/png",
        firstBytes: new Uint8Array(8),
      })
    const objectStorage: SurfaceImageUploadObjectStorage = {
      createPresignedPutUrl: vi.fn().mockResolvedValue("https://r2.test/put"),
      deleteObject: vi.fn(),
      inspectObject,
      copyObject: vi.fn(),
    }
    const storage = createR2SurfaceImageUploadStorage(
      configuration,
      objectStorage
    )
    const authorization = await storage.authorizeUpload({
      surface: "obverse",
      contentType: "image/png",
      contentLength: 8,
    })

    await expect(
      storage.prepareUpload(authorization.reference, "obverse")
    ).rejects.toThrow("does not match its authorization")
    await expect(
      storage.prepareUpload(authorization.reference, "obverse")
    ).rejects.toThrow("content is invalid")
    expect(objectStorage.copyObject).not.toHaveBeenCalled()
  })

  it("classifies a missing authorized object as an invalid upload", async () => {
    const objectStorage: SurfaceImageUploadObjectStorage = {
      createPresignedPutUrl: vi.fn().mockResolvedValue("https://r2.test/put"),
      deleteObject: vi.fn(),
      inspectObject: vi
        .fn()
        .mockRejectedValue(new SurfaceImageObjectNotFoundError()),
      copyObject: vi.fn(),
    }
    const storage = createR2SurfaceImageUploadStorage(
      configuration,
      objectStorage
    )
    const authorization = await storage.authorizeUpload({
      surface: "obverse",
      contentType: "image/png",
      contentLength: 8,
    })

    await expect(
      storage.prepareUpload(authorization.reference, "obverse")
    ).rejects.toThrow("upload is missing")
  })
})
