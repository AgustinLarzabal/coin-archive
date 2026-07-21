import { describe, expect, it, vi } from "vitest"

import {
  SURFACE_IMAGE_MAX_BYTES,
  createR2SurfaceImageStorage,
} from "./surface-image-storage"
import type { SurfaceImageObjectStorage } from "./surface-image-storage"

const configuration = {
  endpoint: "https://account-id.r2.cloudflarestorage.com",
  bucket: "coin-images",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
  publicBaseUrl: "https://images.example.test",
}

describe("R2 Surface Image storage", () => {
  it("rejects unsupported or oversized upload authorizations before issuing a URL", async () => {
    const storage = createR2SurfaceImageStorage(configuration)

    await expect(
      storage.authorizeUpload({
        surface: "obverse",
        contentType: "image/gif",
        contentLength: 10,
      })
    ).rejects.toThrow("Surface Images must be JPEG, PNG, or WebP files.")

    await expect(
      storage.authorizeUpload({
        surface: "edge",
        contentType: "image/webp",
        contentLength: SURFACE_IMAGE_MAX_BYTES + 1,
      })
    ).rejects.toThrow("Surface Images must be 10 MB or smaller.")
  })

  it("resolves an inspected JPEG to its stable public URL", async () => {
    const objectStorage: SurfaceImageObjectStorage = {
      createPresignedPutUrl: vi.fn().mockResolvedValue("https://r2.example.test/put"),
      inspectObject: vi.fn().mockResolvedValue({
        contentLength: 3,
        contentType: "image/jpeg",
        firstBytes: new Uint8Array([0xff, 0xd8, 0xff]),
      }),
    }
    const storage = createR2SurfaceImageStorage(configuration, objectStorage)
    const authorization = await storage.authorizeUpload({
      surface: "obverse",
      contentType: "image/jpeg",
      contentLength: 3,
    })

    await expect(
      storage.resolveUpload(authorization.reference, "obverse")
    ).resolves.toEqual({
      imageUrl: expect.stringContaining("https://images.example.test/surface-images/"),
    })
    expect(objectStorage.createPresignedPutUrl).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "image/jpeg", contentLength: 3 })
    )
  })

  it("rejects objects whose bytes do not match their authorized image type", async () => {
    const storage = createR2SurfaceImageStorage(configuration, {
      createPresignedPutUrl: vi.fn().mockResolvedValue("https://r2.example.test/put"),
      inspectObject: vi.fn().mockResolvedValue({
        contentLength: 3,
        contentType: "image/jpeg",
        firstBytes: new Uint8Array([0x47, 0x49, 0x46]),
      }),
    })
    const authorization = await storage.authorizeUpload({
      surface: "reverse",
      contentType: "image/jpeg",
      contentLength: 3,
    })

    await expect(
      storage.resolveUpload(authorization.reference, "reverse")
    ).rejects.toThrow("Uploaded Surface Image content is invalid.")
  })

  it("does not resolve an authorization for a different Coin Surface", async () => {
    const storage = createR2SurfaceImageStorage(configuration, {
      createPresignedPutUrl: vi.fn().mockResolvedValue("https://r2.example.test/put"),
      inspectObject: vi.fn(),
    })
    const authorization = await storage.authorizeUpload({
      surface: "edge",
      contentType: "image/webp",
      contentLength: 12,
    })

    await expect(
      storage.resolveUpload(authorization.reference, "obverse")
    ).rejects.toThrow("not authorized for this Surface")
  })
})
