import { describe, expect, it } from "vitest"
import { normalizeOptionalUrl } from "./normalize-optional-url"

describe("normalizeOptionalUrl", () => {
  it("trims surrounding whitespace, collapses blank input to null, and preserves URL contents", () => {
    expect(normalizeOptionalUrl(undefined)).toBeNull()
    expect(normalizeOptionalUrl(null)).toBeNull()
    expect(normalizeOptionalUrl("  \n\t  ")).toBeNull()
    expect(
      normalizeOptionalUrl(
        "  HTTPS://example.com/image?id=ABC123#Large Preview  "
      )
    ).toBe("HTTPS://example.com/image?id=ABC123#Large Preview")
  })
})
