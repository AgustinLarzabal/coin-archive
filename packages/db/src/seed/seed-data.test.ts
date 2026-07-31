import { describe, expect, expectTypeOf, it } from "vitest"
import type { SeededCoin, SeededCoinSurfaceDetails } from "./seed-data"
import {
  seededCoinRulers,
  seededCoinSurfaces,
  seededCoins,
  seededCompositions,
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
      },
      {
        coinTitle: "Spain 2 Euro",
        kind: "reverse",
        description: "Map of Europe with denomination.",
        lettering: "2 EURO",
      },
      {
        coinTitle: "Spain 2 Euro",
        kind: "edge-surface",
        description: "Finely reeded with incuse lettering.",
        lettering: "2 **",
      },
    ])
  })

  it("seeds at least 30 coins", () => {
    expect(seededCoins.length).toBeGreaterThanOrEqual(30)
  })

  it("retains distinct Coin-owned Bimetallic Composition Descriptions", () => {
    expect(
      seededCoins
        .filter(
          ({ compositionCode, compositionDescription }) =>
            compositionCode === "bimetallic" &&
            compositionDescription !== undefined
        )
        .map(({ title, compositionDescription }) => ({
          title,
          compositionDescription,
        }))
    ).toEqual([
      {
        title: "2 Euros (Enlargement of the European Union)",
        compositionDescription:
          "Outer ring: copper-nickel. Core: three layers of nickel-brass, nickel, and nickel-brass.",
      },
      {
        title: "Spain 1 Euro",
        compositionDescription:
          "Outer ring: nickel-brass. Core: three layers of copper-nickel, nickel, and copper-nickel.",
      },
    ])
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

describe("seededCompositions", () => {
  it("contains only broad reusable Composition categories", () => {
    expect(
      seededCompositions.map(({ code, name }) => ({ code, name }))
    ).toEqual([
      { code: "silver", name: "Silver" },
      { code: "copper", name: "Copper" },
      { code: "copper-nickel", name: "Copper-nickel" },
      { code: "copper-nickel-clad", name: "Copper-nickel clad" },
      { code: "bimetallic", name: "Bimetallic" },
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
