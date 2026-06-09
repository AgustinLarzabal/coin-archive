import { describe, expect, it } from "vitest"
import { normalizeCoinComments } from "./normalize-coin-comments"

describe("normalizeCoinComments", () => {
  it("trims outer whitespace, preserves internal line breaks, and collapses blank input to null", () => {
    expect(normalizeCoinComments(undefined)).toBeNull()
    expect(normalizeCoinComments(null)).toBeNull()
    expect(normalizeCoinComments("  \n\t  ")).toBeNull()
    expect(
      normalizeCoinComments("  Public catalogue note.\nSecond line.  ")
    ).toBe("Public catalogue note.\nSecond line.")
  })
})
