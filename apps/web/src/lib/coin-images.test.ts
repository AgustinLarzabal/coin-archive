import { describe, expect, it } from "vitest"

import {
  getCoinPreviewImageUrl,
  getSurfaceImageUrl,
  PLACEHOLDER_COIN_IMAGE_URL,
} from "./coin-images"

describe("surface image presentation", () => {
  it("uses a Surface Image for detail and compact presentation", () => {
    const imageUrl = "https://images.example.com/coins/obverse.jpg"

    expect(getSurfaceImageUrl({ imageUrl })).toBe(imageUrl)
    expect(
      getCoinPreviewImageUrl({
        obverse: { imageUrl },
      })
    ).toBe(imageUrl)
  })

  it("uses the existing placeholder when a Surface Image is absent", () => {
    expect(getSurfaceImageUrl(null)).toBe(PLACEHOLDER_COIN_IMAGE_URL)
    expect(
      getCoinPreviewImageUrl({
        obverse: { imageUrl: null },
        reverse: { imageUrl: null },
        edge: { imageUrl: null },
      })
    ).toBe(PLACEHOLDER_COIN_IMAGE_URL)
  })
})
