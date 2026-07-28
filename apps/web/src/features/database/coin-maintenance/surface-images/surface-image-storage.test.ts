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

  it("creates a presigned upload URL with the R2 S3 client", async () => {
    const storage = createR2SurfaceImageStorage(configuration)

    const authorization = await storage.authorizeUpload({
      surface: "obverse",
      contentType: "image/png",
      contentLength: 12,
    })
    const uploadUrl = new URL(authorization.uploadUrl)

    expect(authorization.reference).toEqual(expect.any(String))
    expect(uploadUrl.searchParams.get("X-Amz-Expires")).toBe("300")
    expect(uploadUrl.searchParams.get("X-Amz-Signature")).not.toBeNull()
    expect(uploadUrl.searchParams.get("X-Amz-SignedHeaders")).toBe(
      "content-type;host"
    )
  })

  it("resolves an inspected JPEG to its stable public URL", async () => {
    const objectStorage: SurfaceImageObjectStorage = {
      createPresignedPutUrl: vi
        .fn()
        .mockResolvedValue("https://r2.example.test/put"),
      inspectObject: vi.fn().mockResolvedValue({
        contentLength: 3,
        contentType: "image/jpeg",
        firstBytes: new Uint8Array([0xff, 0xd8, 0xff]),
      }),
      deleteObject: vi.fn(),
    }
    const storage = createR2SurfaceImageStorage(configuration, objectStorage)
    const authorization = await storage.authorizeUpload({
      surface: "obverse",
      contentType: "image/jpeg",
      contentLength: 3,
    })

    expect(
      Buffer.from(authorization.reference.split(".")[1]!, "base64url").toString(
        "utf8"
      )
    ).not.toContain("surface-images/")

    await expect(
      storage.resolveUpload(authorization.reference, "obverse")
    ).resolves.toEqual({
      imageUrl: expect.stringContaining(
        "https://images.example.test/surface-images/"
      ),
    })
    expect(objectStorage.createPresignedPutUrl).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "image/jpeg", contentLength: 3 })
    )
  })

  it("rejects objects whose bytes do not match their authorized image type", async () => {
    const storage = createR2SurfaceImageStorage(configuration, {
      createPresignedPutUrl: vi
        .fn()
        .mockResolvedValue("https://r2.example.test/put"),
      inspectObject: vi.fn().mockResolvedValue({
        contentLength: 3,
        contentType: "image/jpeg",
        firstBytes: new Uint8Array([0x47, 0x49, 0x46]),
      }),
      deleteObject: vi.fn(),
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
      createPresignedPutUrl: vi
        .fn()
        .mockResolvedValue("https://r2.example.test/put"),
      inspectObject: vi.fn(),
      deleteObject: vi.fn(),
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

  it("deletes only objects addressed by its own upload reference or public URL", async () => {
    const objectStorage: SurfaceImageObjectStorage = {
      createPresignedPutUrl: vi
        .fn()
        .mockResolvedValue("https://r2.example.test/put"),
      inspectObject: vi.fn(),
      deleteObject: vi.fn(),
    }
    const storage = createR2SurfaceImageStorage(configuration, objectStorage)
    const authorization = await storage.authorizeUpload({
      surface: "edge",
      contentType: "image/webp",
      contentLength: 12,
    })

    await storage.deleteUpload(authorization.reference, "edge")
    await storage.deletePublishedImage(
      "https://images.example.test/surface-images/persisted-image"
    )

    expect(objectStorage.deleteObject).toHaveBeenCalledTimes(2)
    expect(objectStorage.deleteObject).toHaveBeenLastCalledWith(
      "surface-images/persisted-image"
    )
    await expect(
      storage.deletePublishedImage("https://elsewhere.example.test/image.jpg")
    ).rejects.toThrow("not managed")
  })
})
