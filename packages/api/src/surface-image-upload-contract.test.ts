import { describe, expect, it } from "vitest"

import {
  surfaceImageUploadAuthorizationInputSchema,
  surfaceImageUploadAuthorizationOutputSchema,
  surfaceImageUploadCancellationInputSchema,
} from "./contract"

describe("Surface Image upload maintenance contract", () => {
  it.each(["obverse", "reverse", "edge"] as const)(
    "authorizes a bounded %s Surface Image upload idempotently",
    (surface) => {
      expect(
        surfaceImageUploadAuthorizationInputSchema.parse({
          headers: { "idempotency-key": "upload-attempt-1" },
          body: {
            surface,
            contentType: "image/webp",
            contentLength: 10 * 1024 * 1024,
          },
        })
      ).toStrictEqual({
        headers: { "idempotency-key": "upload-attempt-1" },
        body: {
          surface,
          contentType: "image/webp",
          contentLength: 10 * 1024 * 1024,
        },
      })
    }
  )

  it("retains the image allowlist, non-empty files, and 10 MB limit", () => {
    const input = {
      headers: { "idempotency-key": "upload-attempt-1" },
      body: {
        surface: "obverse",
        contentType: "image/jpeg",
        contentLength: 1,
      },
    }

    expect(surfaceImageUploadAuthorizationInputSchema.parse(input)).toEqual(
      input
    )
    expect(() =>
      surfaceImageUploadAuthorizationInputSchema.parse({
        ...input,
        body: { ...input.body, contentType: "image/gif" },
      })
    ).toThrow()
    expect(() =>
      surfaceImageUploadAuthorizationInputSchema.parse({
        ...input,
        body: { ...input.body, contentLength: 0 },
      })
    ).toThrow()
    expect(() =>
      surfaceImageUploadAuthorizationInputSchema.parse({
        ...input,
        body: { ...input.body, contentLength: 10 * 1024 * 1024 + 1 },
      })
    ).toThrow()
  })

  it("returns an opaque reference and five-minute direct PUT authorization", () => {
    expect(
      surfaceImageUploadAuthorizationOutputSchema.parse({
        status: 201,
        body: {
          reference: "opaque-upload-reference",
          uploadUrl: "https://account.r2.cloudflarestorage.com/presigned",
          expiresAt: "2026-08-03T10:05:00.000Z",
        },
      })
    ).toStrictEqual({
      status: 201,
      body: {
        reference: "opaque-upload-reference",
        uploadUrl: "https://account.r2.cloudflarestorage.com/presigned",
        expiresAt: "2026-08-03T10:05:00.000Z",
      },
    })
  })

  it("cancels by opaque body reference so sensitive references stay out of URLs", () => {
    expect(
      surfaceImageUploadCancellationInputSchema.parse({
        body: {
          surface: "reverse",
          reference: "opaque-upload-reference",
        },
      })
    ).toStrictEqual({
      body: {
        surface: "reverse",
        reference: "opaque-upload-reference",
      },
    })
  })
})
