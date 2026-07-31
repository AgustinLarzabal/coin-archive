import { describe, expect, expectTypeOf, it } from "vitest"
import type { SeededCoin, SeededCoinSurfaceDetails } from "./seed-data"
import {
  seededCoinRulers,
  seededCoinSurfaces,
  seededCoins,
  seededCompositions,
  seededCurrencies,
  seededEdges,
  seededIssuers,
  seededMints,
  seededRims,
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

  it("only seeds coins whose issuer is configured", () => {
    const issuerCodes = new Set(seededIssuers.map(({ code }) => code))

    expect(
      seededCoins.filter(({ issuerCode }) => !issuerCodes.has(issuerCode))
    ).toEqual([])
  })

  it("retains distinct Coin-owned Bimetallic Composition Descriptions", () => {
    const descriptions = seededCoins
      .filter(({ compositionCode }) => compositionCode === "bimetallic")
      .map(({ compositionDescription }) => compositionDescription)
      .filter(
        (description): description is string =>
          description?.trim().length !== undefined &&
          description.trim().length > 0
      )

    expect(descriptions.length).toBeGreaterThanOrEqual(2)
    expect(new Set(descriptions).size).toBe(descriptions.length)
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
  it("defines exactly the requested issuers and ISO codes", () => {
    expect(
      seededIssuers.map(({ code, name, isoCode }) => ({ code, name, isoCode }))
    ).toEqual([
      { code: "germany", name: "Germany", isoCode: "DE" },
      { code: "andorra", name: "Andorra", isoCode: "AD" },
      { code: "austria", name: "Austria", isoCode: "AT" },
      { code: "belgium", name: "Belgium", isoCode: "BE" },
      { code: "cyprus", name: "Cyprus", isoCode: "CY" },
      { code: "croatia", name: "Croatia", isoCode: "HR" },
      { code: "slovakia", name: "Slovakia", isoCode: "SK" },
      { code: "slovenia", name: "Slovenia", isoCode: "SI" },
      { code: "spain", name: "Spain", isoCode: "ES" },
      { code: "estonia", name: "Estonia", isoCode: "EE" },
      { code: "finland", name: "Finland", isoCode: "FI" },
      { code: "france", name: "France", isoCode: "FR" },
      { code: "greece", name: "Greece", isoCode: "GR" },
      { code: "ireland", name: "Ireland", isoCode: "IE" },
      { code: "italy", name: "Italy", isoCode: "IT" },
      { code: "latvia", name: "Latvia", isoCode: "LV" },
      { code: "lithuania", name: "Lithuania", isoCode: "LT" },
      { code: "luxembourg", name: "Luxembourg", isoCode: "LU" },
      { code: "malta", name: "Malta", isoCode: "MT" },
      { code: "monaco", name: "Monaco", isoCode: "MC" },
      { code: "netherlands", name: "Netherlands", isoCode: "NL" },
      { code: "portugal", name: "Portugal", isoCode: "PT" },
      { code: "san-marino", name: "San Marino", isoCode: "SM" },
      {
        code: "vatican-city",
        name: "Vatican City",
        isoCode: "VA",
      },
    ])
  })
})

describe("seededCompositions", () => {
  it("defines only the Bimetallic Composition", () => {
    expect(
      seededCompositions.map(({ code, name }) => ({ code, name }))
    ).toEqual([{ code: "bimetallic", name: "Bimetallic" }])
  })

  it("only seeds coins with a configured Composition", () => {
    const compositionCodes = new Set(seededCompositions.map(({ code }) => code))

    expect(
      seededCoins.filter(
        ({ compositionCode }) => !compositionCodes.has(compositionCode)
      )
    ).toEqual([])
  })
})

describe("seededCurrencies", () => {
  it("defines only the Euro Currency", () => {
    expect(
      seededCurrencies.map(({ code, name, fullName }) => ({
        code,
        name,
        fullName,
      }))
    ).toEqual([{ code: "euro", name: "Euro", fullName: "Euro (2002-date)" }])
  })

  it("only seeds coins with a configured Currency", () => {
    const currencyCodes = new Set(seededCurrencies.map(({ code }) => code))

    expect(
      seededCoins.filter(({ currencyCode }) => !currencyCodes.has(currencyCode))
    ).toEqual([])
  })
})

describe("seededEdges", () => {
  it("defines only the Lettered-Signs-Numbers Edge", () => {
    expect(seededEdges.map(({ code, name }) => ({ code, name }))).toEqual([
      {
        code: "lettered-signs-numbers-reeded",
        name: "Lettered-Signs-Numbers (reeded)",
      },
    ])
  })

  it("only assigns configured Edges to seeded coins", () => {
    const edgeCodes = new Set(seededEdges.map(({ code }) => code))

    expect(
      seededCoins.filter(
        ({ edgeCode }) => edgeCode !== undefined && !edgeCodes.has(edgeCode)
      )
    ).toEqual([])
  })
})

describe("seededRims", () => {
  it("defines only the Raised, Not Decorated, Both Sides Rim", () => {
    expect(seededRims.map(({ code, name }) => ({ code, name }))).toEqual([
      {
        code: "raised-not-decorated-both-sides",
        name: "Raised. Not decorated. Both sides",
      },
    ])
  })

  it("only assigns configured Rims to seeded coins", () => {
    const rimCodes = new Set(seededRims.map(({ code }) => code))

    expect(
      seededCoins.filter(
        ({ rimCode }) => rimCode !== undefined && !rimCodes.has(rimCode)
      )
    ).toEqual([])
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
