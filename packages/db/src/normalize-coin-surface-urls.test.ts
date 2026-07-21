import { describe, expect, it } from "vitest"
import { normalizeCoinSurfaceUrls } from "./normalize-coin-surface-urls"

describe("normalizeCoinSurfaceUrls", () => {
  it("normalizes the Surface Image URL", () => {
    expect(normalizeCoinSurfaceUrls({ imageUrl: " \n\t " })).toEqual({
      imageUrl: null,
    })
  })
})
