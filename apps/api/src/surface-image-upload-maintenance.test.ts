import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"
import { SurfaceImageUploadReferenceError } from "./surface-image-storage"

const authorization = {
  reference: "opaque-upload-reference",
  uploadUrl: "https://r2.example.test/presigned?X-Amz-Signature=secret",
  expiresAt: new Date("2026-08-03T10:05:00.000Z"),
}

function createApp(
  overrides: Partial<Parameters<typeof createApiApp>[0]> = {}
) {
  return createApiApp({
    environment: "production",
    surfaceImageOrigin: "https://images.coinarchive.app",
    browseCoins: async () => [],
    getCollector: async () => ({ id: "collector-id", role: "editor" }),
    authorizeSurfaceImageUpload: async () => ({
      status: "created" as const,
      authorization,
    }),
    cancelSurfaceImageUpload: async () => undefined,
    ...overrides,
  })
}

describe("protected Surface Image upload maintenance", () => {
  it("authorizes all Coin Surfaces with replay-safe metadata and a direct R2 PUT URL", async () => {
    const authorizeSurfaceImageUpload = vi.fn(async () => ({
      status: "replayed" as const,
      authorization,
    }))
    const app = createApp({ authorizeSurfaceImageUpload })

    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/surface-image-uploads",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "upload-attempt-1",
        },
        body: JSON.stringify({
          surface: "edge",
          contentType: "image/webp",
          contentLength: 1024,
        }),
      }
    )

    expect(response.status).toBe(201)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(response.headers.get("access-control-allow-origin")).toBeNull()
    await expect(response.json()).resolves.toStrictEqual({
      reference: authorization.reference,
      uploadUrl: authorization.uploadUrl,
      expiresAt: "2026-08-03T10:05:00.000Z",
    })
    expect(authorizeSurfaceImageUpload).toHaveBeenCalledWith({
      collectorId: "collector-id",
      idempotencyKey: "upload-attempt-1",
      requestHash: expect.stringMatching(/^[A-Za-z0-9_-]+$/),
      expiresAt: expect.any(Date),
      upload: {
        surface: "edge",
        contentType: "image/webp",
        contentLength: 1024,
      },
    })
  })

  it("requires Editor access before storage authorization or cancellation", async () => {
    const authorizeSurfaceImageUpload = vi.fn()
    const cancelSurfaceImageUpload = vi.fn()

    for (const [collector, expectedStatus] of [
      [null, 401],
      [{ id: "collector-id", role: "collector" as const }, 403],
    ] as const) {
      const app = createApp({
        getCollector: async () => collector,
        authorizeSurfaceImageUpload,
        cancelSurfaceImageUpload,
      })
      const response = await app.request(
        "https://api.coinarchive.app/api/v1/maintenance/surface-image-uploads",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surface: "reverse",
            reference: "opaque-upload-reference",
          }),
        }
      )
      expect(response.status).toBe(expectedStatus)
    }

    expect(authorizeSurfaceImageUpload).not.toHaveBeenCalled()
    expect(cancelSurfaceImageUpload).not.toHaveBeenCalled()
  })

  it("rejects missing keys, invalid image metadata, and mismatched idempotency reuse", async () => {
    const app = createApp({
      authorizeSurfaceImageUpload: async () => ({ status: "mismatch" }),
    })
    const inputs = [
      {
        headers: { "Content-Type": "application/json" },
        body: {
          surface: "obverse",
          contentType: "image/png",
          contentLength: 1,
        },
        status: 400,
        code: "idempotency_key_required",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: {
          surface: "obverse",
          contentType: "image/gif",
          contentLength: 1,
        },
        status: 422,
        code: "surface_image_upload_validation_failed",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: {
          surface: "obverse",
          contentType: "image/png",
          contentLength: 1,
        },
        status: 409,
        code: "idempotency_key_reused",
      },
    ]

    for (const input of inputs) {
      const response = await app.request(
        "https://api.coinarchive.app/api/v1/maintenance/surface-image-uploads",
        {
          method: "POST",
          headers: new Headers(
            Object.entries(input.headers).filter(
              (entry): entry is [string, string] => entry[1] !== undefined
            )
          ),
          body: JSON.stringify(input.body),
        }
      )
      expect(response.status).toBe(input.status)
      await expect(response.json()).resolves.toMatchObject({ code: input.code })
    }
  })

  it("cancels a temporary upload without placing its reference in the URL", async () => {
    const cancelSurfaceImageUpload = vi.fn(async () => undefined)
    const app = createApp({ cancelSurfaceImageUpload })
    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/surface-image-uploads",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surface: "reverse",
          reference: "opaque-upload-reference",
        }),
      }
    )

    expect(response.status).toBe(204)
    expect(cancelSurfaceImageUpload).toHaveBeenCalledWith({
      surface: "reverse",
      reference: "opaque-upload-reference",
    })
  })

  it("returns sanitized invalid and expired reference problems", async () => {
    for (const reason of ["invalid", "expired"] as const) {
      const app = createApp({
        cancelSurfaceImageUpload: async () => {
          throw new SurfaceImageUploadReferenceError(
            reason,
            `sensitive ${reason} storage detail`
          )
        },
      })
      const response = await app.request(
        "https://api.coinarchive.app/api/v1/maintenance/surface-image-uploads",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ surface: "edge", reference: "secret-ref" }),
        }
      )

      expect(response.status).toBe(422)
      const body = await response.text()
      expect(body).not.toContain("secret-ref")
      expect(body).not.toContain("sensitive")
      expect(JSON.parse(body)).toMatchObject({
        code: reason === "expired"
          ? "surface_image_upload_expired"
          : "surface_image_upload_reference_invalid",
      })
    }
  })

  it("excludes upload URLs and references from operational logs", async () => {
    const writeLog = vi.fn()
    const app = createApp({ writeLog })
    await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/surface-image-uploads",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({
          surface: "obverse",
          contentType: "image/jpeg",
          contentLength: 3,
        }),
      }
    )

    expect(JSON.stringify(writeLog.mock.calls)).not.toMatch(
      /opaque-upload-reference|presigned|signature=secret/i
    )
  })
})
