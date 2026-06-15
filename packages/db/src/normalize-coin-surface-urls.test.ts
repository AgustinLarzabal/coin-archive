import { describe, expect, it } from "vitest"
import { normalizeCoinSurfaceUrls } from "./normalize-coin-surface-urls"

describe("normalizeCoinSurfaceUrls", () => {
  it("normalizes thumbnail and image URLs independently", () => {
    expect(
      normalizeCoinSurfaceUrls({
        thumbnailUrl: "  https://example.com/thumb  ",
        imageUrl: " \n\t ",
      })
    ).toEqual({
      thumbnailUrl: "https://example.com/thumb",
      imageUrl: null,
    })
  })
})
