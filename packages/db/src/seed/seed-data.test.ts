import { describe, expect, expectTypeOf, it } from "vitest"
import type { SeededCoin, SeededCoinSurfaceDetails } from "./seed-data"
import { seededCoinSurfaces, seededIssuers, seededMints } from "./seed-data"

describe("SeededCoin", () => {
  it("accepts nullable comments in seed input", () => {
    expectTypeOf<SeededCoin["comments"]>().toEqualTypeOf<
      string | null | undefined
    >()
  })

  it("accepts nullable demonetization and mintage fields in seed input", () => {
    expectTypeOf<SeededCoin["isDemonetized"]>().toEqualTypeOf<
      boolean | null | undefined
    >()
    expectTypeOf<SeededCoin["mintage"]>().toEqualTypeOf<
      number | null | undefined
    >()
  })

  it("defines coin surface seed rows directly", () => {
    expectTypeOf<SeededCoinSurfaceDetails["thumbnailUrl"]>().toEqualTypeOf<
      string | null | undefined
    >()
    expectTypeOf<SeededCoinSurfaceDetails["imageUrl"]>().toEqualTypeOf<
      string | null | undefined
    >()

    expect(
      seededCoinSurfaces.filter(({ coinTitle }) => coinTitle === "Spain 2 Euro")
    ).toEqual([
      {
        coinTitle: "Spain 2 Euro",
        kind: "obverse",
        description: "Portrait of Felipe VI facing left.",
        lettering: "FELIPE VI REY DE ESPANA",
        thumbnailUrl:
          "https://example.com/coins/spain-2-euro/obverse-thumbnail",
        imageUrl: "https://example.com/coins/spain-2-euro/obverse-image",
      },
      {
        coinTitle: "Spain 2 Euro",
        kind: "reverse",
        description: "Map of Europe with denomination.",
        lettering: "2 EURO",
        thumbnailUrl: "https://example.com/coins/spain-2-euro/reverse-thumbnail",
        imageUrl: "https://example.com/coins/spain-2-euro/reverse-image",
      },
      {
        coinTitle: "Spain 2 Euro",
        kind: "edge-surface",
        description: "Finely reeded with incuse lettering.",
        lettering: "2 **",
        thumbnailUrl:
          "https://example.com/coins/spain-2-euro/edge-surface-thumbnail",
        imageUrl: "https://example.com/coins/spain-2-euro/edge-surface-image",
      },
    ])
  })
})

describe("seededIssuers", () => {
  it("defines required ISO Codes for the demo issuers", () => {
    expect(seededIssuers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "argentina", isoCode: "AR" }),
        expect.objectContaining({ code: "buenos-aires", isoCode: "AR" }),
        expect.objectContaining({ code: "united-states", isoCode: "US" }),
        expect.objectContaining({ code: "spain", isoCode: "ES" }),
      ])
    )
  })
})

describe("seededMints", () => {
  it("uses unique mint codes", () => {
    expect(new Set(seededMints.map(({ code }) => code)).size).toBe(seededMints.length)
  })
})
