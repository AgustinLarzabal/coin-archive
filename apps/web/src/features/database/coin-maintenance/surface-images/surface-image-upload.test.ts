import { describe, expect, it } from "vitest"

import { getSurfaceImageFileError } from "./surface-image-upload"

describe("SurfaceImageUpload file validation", () => {
  it("accepts JPEG, PNG, and WebP files up to 10 MB", () => {
    expect(
      getSurfaceImageFileError({ type: "image/jpeg", size: 10 * 1024 * 1024 })
    ).toBeNull()
    expect(getSurfaceImageFileError({ type: "image/png", size: 1 })).toBeNull()
    expect(getSurfaceImageFileError({ type: "image/webp", size: 1 })).toBeNull()
  })

  it("reports clear errors for unsupported and oversized files", () => {
    expect(getSurfaceImageFileError({ type: "image/gif", size: 1 })).toBe(
      "Surface Images must be JPEG, PNG, or WebP files."
    )
    expect(
      getSurfaceImageFileError({
        type: "image/png",
        size: 10 * 1024 * 1024 + 1,
      })
    ).toBe("Surface Images must be 10 MB or smaller.")
    expect(getSurfaceImageFileError({ type: "image/png", size: 0 })).toBe(
      "Surface Image files must not be empty."
    )
  })
})
