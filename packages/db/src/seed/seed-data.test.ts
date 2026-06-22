import { describe, expect, expectTypeOf, it } from "vitest"
import type { SeededCoin, SeededCoinSurfaceDetails } from "./seed-data"
import {
  seededCoinRulers,
  seededCoinSurfaces,
  seededCoins,
  seededIssuers,
  seededMints,
} from "./seed-data"

function getSortedCoinTitles(records: { title: string }[]) {
  return records.map(({ title }) => title).sort()
}

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
        thumbnailUrl: "http://localhost:3000/placeholder-coin.svg",
        imageUrl: "http://localhost:3000/placeholder-coin.svg",
      },
      {
        coinTitle: "Spain 2 Euro",
        kind: "reverse",
        description: "Map of Europe with denomination.",
        lettering: "2 EURO",
        thumbnailUrl: "http://localhost:3000/placeholder-coin.svg",
        imageUrl: "http://localhost:3000/placeholder-coin.svg",
      },
      {
        coinTitle: "Spain 2 Euro",
        kind: "edge-surface",
        description: "Finely reeded with incuse lettering.",
        lettering: "2 **",
        thumbnailUrl: "http://localhost:3000/placeholder-coin.svg",
        imageUrl: "http://localhost:3000/placeholder-coin.svg",
      },
    ])
  })

  it("seeds at least 30 coins", () => {
    expect(seededCoins.length).toBeGreaterThanOrEqual(30)
  })

  it("has at least one ruler attribution for every seeded coin", () => {
    const coinTitlesWithRulers = new Set(
      seededCoinRulers.map(({ coinTitle }) => coinTitle)
    )

    expect(
      seededCoins
        .map(({ title }) => title)
        .filter((title) => !coinTitlesWithRulers.has(title))
    ).toEqual([])
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
    expect(new Set(seededMints.map(({ code }) => code)).size).toBe(
      seededMints.length
    )
  })
})

describe("seededCoinRulers", () => {
  it("assigns at least one ruler attribution to every seeded coin", () => {
    const coinTitlesWithRulerAttributions = [
      ...new Set(seededCoinRulers.map(({ coinTitle }) => coinTitle)),
    ].sort()

    expect(coinTitlesWithRulerAttributions).toEqual(
      getSortedCoinTitles(seededCoins)
    )
  })
})
