import { describe, expect, expectTypeOf, it } from "vitest"
import type { SeededCoin, SeededCoinSurfaceDetails } from "./seed-data"
import {
  seededCoinMints,
  seededCoinRulers,
  seededCoinSurfaceEngravers,
  seededCoinSurfaces,
  seededCoinThemes,
  seededCoins,
  seededCompositions,
  seededCurrencies,
  seededEdges,
  seededEngravers,
  seededIssuers,
  seededMints,
  seededOrientations,
  seededRims,
  seededRulers,
  seededShapes,
  seededTechniques,
  seededThemes,
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
      seededCoinSurfaces.filter(
        ({ coinTitle }) =>
          coinTitle ===
          "400 Aniversario de la 1a. edición del «Don Quijote de la Mancha»"
      )
    ).toEqual([
      {
        coinTitle:
          "400 Aniversario de la 1a. edición del «Don Quijote de la Mancha»",
        kind: "obverse",
        description:
          "Half-length figure of Don Quixote with hat holding a lance and two windmills in the background. Twelve stars of Europe of which four are bound by a band.",
        lettering: "ESPAÑA M 20 05",
      },
      {
        coinTitle:
          "400 Aniversario de la 1a. edición del «Don Quijote de la Mancha»",
        kind: "reverse",
        description:
          "Map of Europe symbolizing the gathering of the fifteen nations of the European Union and twelve stars (six above and six below map).",
        lettering: "2 EURO LL",
      },
      {
        coinTitle:
          "400 Aniversario de la 1a. edición del «Don Quijote de la Mancha»",
        kind: "edge-surface",
        description:
          'Lettering on reeding. The sequence "2 ★ ★" repeated six times alternately upright and inverted.',
        lettering: "2 ★ ★ ↊ ★ ★ 2 ★ ★ ↊ ★ ★ 2 ★ ★ ↊ ★ ★",
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

    expect(descriptions).toHaveLength(seededCoins.length)
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

describe("seededShapes", () => {
  it("defines only the Circular Shape", () => {
    expect(seededShapes.map(({ code, name }) => ({ code, name }))).toEqual([
      { code: "circular", name: "Circular" },
    ])
  })

  it("only assigns configured Shapes to seeded coins", () => {
    const shapeCodes = new Set(seededShapes.map(({ code }) => code))

    expect(
      seededCoins.filter(
        ({ shapeCode }) => shapeCode !== undefined && !shapeCodes.has(shapeCode)
      )
    ).toEqual([])
  })
})

describe("seededTechniques", () => {
  it("defines only the Milled Minting Technique", () => {
    expect(seededTechniques.map(({ code, name }) => ({ code, name }))).toEqual([
      { code: "milled", name: "Milled" },
    ])
  })

  it("only assigns configured Minting Techniques to seeded coins", () => {
    const techniqueCodes = new Set(seededTechniques.map(({ code }) => code))

    expect(
      seededCoins.filter(
        ({ techniqueCode }) =>
          techniqueCode !== undefined && !techniqueCodes.has(techniqueCode)
      )
    ).toEqual([])
  })
})

describe("seededEngravers", () => {
  it("defines only the requested Engravers", () => {
    expect(seededEngravers.map(({ code, name }) => ({ code, name }))).toEqual([
      {
        code: "luc-luycx",
        name: "Luc Luycx",
      },
      {
        code: "begona-castellanos-garcia",
        name: "Begoña Castellanos García",
      },
    ])
  })

  it("only assigns configured Engravers to seeded Coin Faces", () => {
    const engraverCodes = new Set(seededEngravers.map(({ code }) => code))

    expect(
      seededCoinSurfaceEngravers.filter(
        ({ engraverCode }) => !engraverCodes.has(engraverCode)
      )
    ).toEqual([])
  })
})

describe("seededThemes", () => {
  it("defines only the Map Theme", () => {
    expect(seededThemes.map(({ code, name }) => ({ code, name }))).toEqual([
      { code: "map", name: "Map" },
    ])
  })

  it("only assigns configured Themes to seeded coins", () => {
    const themeCodes = new Set(seededThemes.map(({ code }) => code))

    expect(
      seededCoinThemes.filter(({ themeCode }) => !themeCodes.has(themeCode))
    ).toEqual([])
  })
})

describe("seededRulers", () => {
  it("defines only Felipe VI", () => {
    expect(seededRulers.map(({ code, name }) => ({ code, name }))).toEqual([
      { code: "felipe-vi", name: "Felipe VI" },
    ])
  })

  it("only assigns configured Rulers to seeded coins", () => {
    const rulerCodes = new Set(seededRulers.map(({ code }) => code))

    expect(
      seededCoinRulers.filter(({ rulerCode }) => !rulerCodes.has(rulerCode))
    ).toEqual([])
  })
})

describe("seededOrientations", () => {
  it("defines only Medal Alignment", () => {
    expect(
      seededOrientations.map(({ code, name }) => ({ code, name }))
    ).toEqual([{ code: "medal-alignment", name: "Medal alignment" }])
  })

  it("only assigns configured Orientations to seeded coins", () => {
    const orientationCodes = new Set(seededOrientations.map(({ code }) => code))

    expect(
      seededCoins.filter(
        ({ orientationCode }) =>
          orientationCode !== undefined &&
          !orientationCodes.has(orientationCode)
      )
    ).toEqual([])
  })
})

describe("seededMints", () => {
  it("defines only the Royal Mint of Madrid", () => {
    expect(seededMints.map(({ code, name }) => ({ code, name }))).toEqual([
      { code: "royal-mint-of-madrid", name: "Royal Mint of Madrid" },
    ])
  })

  it("only assigns configured Mints to seeded coins", () => {
    const mintCodes = new Set(seededMints.map(({ code }) => code))

    expect(
      seededCoinMints.filter(({ mintCode }) => !mintCodes.has(mintCode))
    ).toEqual([])
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
