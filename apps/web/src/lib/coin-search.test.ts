import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import {
  applyFaceValueRangeSearch,
  applyIssueYearRangeSearch,
  applyMeasurementRangeSearch,
  coinSearchSchema,
  demonetizationFilterOptions,
  findSelectedDemonetizationFilterOption,
  findSelectedCatalogueOption,
  findSelectedCompositionOption,
  findSelectedCurrencyOption,
  findSelectedDistributionOption,
  findSelectedEdgeOption,
  findSelectedEngraverOption,
  findSelectedIssuerOption,
  findSelectedMintOption,
  findSelectedOrientationOption,
  findSelectedRimOption,
  findSelectedRulerOption,
  findSelectedShapeOption,
  findSelectedTechniqueOption,
  findSelectedThemeOption,
  formatMintNames,
  formatIssueYearRangeLabel,
  formatMeasurementLabel,
  getCatalogueOptionLabel,
  getCompositionOptionLabel,
  getCurrencyOptionLabel,
  getDistributionOptionLabel,
  getEdgeOptionLabel,
  getEngraverOptionLabel,
  getMintOptionLabel,
  getOrientationOptionLabel,
  getRimOptionLabel,
  getShapeOptionLabel,
  getTechniqueOptionLabel,
  getThemeOptionLabel,
  getCoinListLoaderDeps,
  updateCoinSearchFilter,
} from "./coin-search"
import type { CoinSearch, CoinListLoaderDeps } from "./coin-search"

const currentSearch = {
  catalogue: "km",
  composition: "silver-900",
  currency: "euro",
  distribution: "circulating-commemorative",
  fromYear: 1898,
  issuer: "spain",
  maxDiameter: 30.5,
  maxThickness: 2.5,
  maxWeight: 8.75,
  maxValue: 2,
  minDiameter: 20.25,
  minThickness: 1.25,
  minWeight: 4.5,
  minValue: 0.5,
  referenceNumber: "1338",
  ruler: "felipe-vi",
  toYear: 1902,
} satisfies CoinSearch

const baseCoinListLoaderDeps = {
  catalogueCode: "km",
  compositionCode: "silver-900",
  currencyCode: "euro",
  distributionCode: "circulating-commemorative",
  fromYear: 1898,
  issuerCode: "spain",
  maxDiameter: 30.5,
  maxThickness: 2.5,
  maxWeight: 8.75,
  maxValue: 2,
  minDiameter: 20.25,
  minThickness: 1.25,
  minWeight: 4.5,
  minValue: 0.5,
  referenceNumber: "1338",
  rulerCode: "felipe-vi",
  toYear: 1902,
} satisfies CoinListLoaderDeps

const currentSearchWithMint = {
  ...currentSearch,
  mint: "royal-mint-of-madrid",
}

const currentSearchWithEdge = {
  ...currentSearch,
  edge: "reeded",
}

const currentSearchWithOrientation = {
  ...currentSearch,
  orientation: "coin-alignment",
}

const currentSearchWithTheme = {
  ...currentSearch,
  theme: "map",
}

const currentSearchWithEngraver = {
  ...currentSearch,
  engraver: "georgios-stamatopoulos",
}

const currentSearchWithTechnique = {
  ...currentSearch,
  technique: "milled",
}

const currentSearchWithDemonetization = {
  ...currentSearch,
  demonetization: "unknown",
} satisfies CoinSearch

const emptyFilterValues = [undefined, ""] as const

function omitFilter<T extends object, TKey extends keyof T>(
  search: T,
  filterName: TKey
): Omit<T, TKey> {
  const { [filterName]: _removedFilter, ...remainingSearch } = search

  return remainingSearch
}

type UnexpectedHomepageSearchParam = {
  comments?: string
  mintage?: string
}

function getCoinListLoaderDepsWithUnexpectedSearchParam(
  search: CoinSearch & UnexpectedHomepageSearchParam
) {
  return getCoinListLoaderDeps(search)
}

describe("updateCoinSearchFilter", () => {
  it("clears only the selected filter and preserves unrelated search params", () => {
    expect(
      updateCoinSearchFilter(currentSearch, "issuer", undefined)
    ).toStrictEqual(omitFilter(currentSearch, "issuer"))
  })

  it.each(emptyFilterValues)(
    "clears the distribution filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "distribution", filterValue)
      ).toStrictEqual(omitFilter(currentSearch, "distribution"))
    }
  )

  it.each(emptyFilterValues)(
    "clears the composition filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "composition", filterValue)
      ).toStrictEqual(omitFilter(currentSearch, "composition"))
    }
  )

  it.each(emptyFilterValues)(
    "clears the currency filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "currency", filterValue)
      ).toStrictEqual(omitFilter(currentSearch, "currency"))
    }
  )

  it.each(emptyFilterValues)(
    "clears the mint filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearchWithMint, "mint", filterValue)
      ).toStrictEqual(omitFilter(currentSearchWithMint, "mint"))
    }
  )

  it.each(emptyFilterValues)(
    "clears the orientation filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(
          currentSearchWithOrientation,
          "orientation",
          filterValue
        )
      ).toStrictEqual(omitFilter(currentSearchWithOrientation, "orientation"))
    }
  )

  it.each(emptyFilterValues)(
    "clears the edge filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearchWithEdge, "edge", filterValue)
      ).toStrictEqual(omitFilter(currentSearchWithEdge, "edge"))
    }
  )

  it.each(emptyFilterValues)(
    "clears the theme filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearchWithTheme, "theme", filterValue)
      ).toStrictEqual(omitFilter(currentSearchWithTheme, "theme"))
    }
  )

  it.each(emptyFilterValues)(
    "clears the engraver filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(
          currentSearchWithEngraver,
          "engraver",
          filterValue
        )
      ).toStrictEqual(omitFilter(currentSearchWithEngraver, "engraver"))
    }
  )

  it.each(emptyFilterValues)(
    "clears the technique filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(
          currentSearchWithTechnique,
          "technique",
          filterValue
        )
      ).toStrictEqual(omitFilter(currentSearchWithTechnique, "technique"))
    }
  )

  it.each(emptyFilterValues)(
    "clears the ruler filter without removing the issuer filter when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "ruler", filterValue)
      ).toStrictEqual(omitFilter(currentSearch, "ruler"))
    }
  )

  it.each(emptyFilterValues)(
    "clears the reference number filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "referenceNumber", filterValue)
      ).toStrictEqual(omitFilter(currentSearch, "referenceNumber"))
    }
  )

  it.each<["" | undefined]>([[undefined], [""]])(
    "clears the fromYear filter without removing unrelated filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "fromYear", filterValue)
      ).toStrictEqual(omitFilter(currentSearch, "fromYear"))
    }
  )

  it.each<["" | undefined]>([[undefined], [""]])(
    "clears the toYear filter without removing unrelated filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "toYear", filterValue)
      ).toStrictEqual(omitFilter(currentSearch, "toYear"))
    }
  )
})

describe("applyIssueYearRangeSearch", () => {
  it("applies open and full issue year windows while preserving unrelated filters", () => {
    expect(
      applyIssueYearRangeSearch(currentSearch, {
        fromYear: "-43",
        toYear: "0",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      distribution: "circulating-commemorative",
      fromYear: -43,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      maxValue: 2,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      minValue: 0.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 0,
    })

    expect(
      applyIssueYearRangeSearch(currentSearch, {
        fromYear: "1900",
        toYear: "",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      distribution: "circulating-commemorative",
      fromYear: 1900,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      maxValue: 2,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      minValue: 0.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
    })
  })

  it("clears either requested year bound without removing unrelated filters or the other bound", () => {
    expect(
      applyIssueYearRangeSearch(currentSearch, {
        fromYear: "",
        toYear: "1902",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      distribution: "circulating-commemorative",
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      maxValue: 2,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      minValue: 0.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })

    expect(
      applyIssueYearRangeSearch(currentSearch, {
        fromYear: "1898",
        toYear: " ",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      maxValue: 2,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      minValue: 0.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
    })
  })

  it("ignores invalid requested year inputs instead of dropping the current bounds", () => {
    expect(
      applyIssueYearRangeSearch(currentSearch, {
        fromYear: "nineteen hundred",
        toYear: "1900",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      maxValue: 2,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      minValue: 0.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1900,
    })
  })
})

describe("formatMintNames", () => {
  it("joins visible mint names for homepage display", () => {
    expect(
      formatMintNames([
        { name: "Buenos Aires Mint" },
        { name: "Royal Mint of Madrid" },
      ])
    ).toBe("Buenos Aires Mint, Royal Mint of Madrid")
  })
})

describe("applyMeasurementRangeSearch", () => {
  it("applies open and full measurement ranges while preserving unrelated filters", () => {
    expect(
      applyMeasurementRangeSearch(currentSearch, {
        minWeight: "5.25",
        maxWeight: "",
        minDiameter: "18.5",
        maxDiameter: "30.25",
        minThickness: "",
        maxThickness: "2.75",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.25,
      maxThickness: 2.75,
      maxValue: 2,
      minDiameter: 18.5,
      minWeight: 5.25,
      minValue: 0.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })

  it("clears requested measurement bounds without removing unrelated filters or the other bounds", () => {
    expect(
      applyMeasurementRangeSearch(currentSearch, {
        minWeight: "",
        maxWeight: "8.75",
        minDiameter: "20.25",
        maxDiameter: "",
        minThickness: "",
        maxThickness: "2.5",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxThickness: 2.5,
      maxWeight: 8.75,
      maxValue: 2,
      minDiameter: 20.25,
      minValue: 0.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })

  it("ignores invalid requested measurement inputs instead of dropping the current bounds", () => {
    expect(
      applyMeasurementRangeSearch(currentSearch, {
        minWeight: "invalid",
        maxWeight: "9.5",
        minDiameter: "-1",
        maxDiameter: "30.75",
        minThickness: "0",
        maxThickness: "2.25",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.75,
      maxThickness: 2.25,
      maxWeight: 9.5,
      maxValue: 2,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      minValue: 0.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })
})

describe("applyFaceValueRangeSearch", () => {
  it("applies a full face value range while preserving unrelated filters", () => {
    expect(
      applyFaceValueRangeSearch(currentSearch, {
        minValue: "0.25",
        maxValue: "1.5",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxValue: 1.5,
      maxWeight: 8.75,
      minDiameter: 20.25,
      minThickness: 1.25,
      minValue: 0.25,
      minWeight: 4.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })

  it("clears requested face value bounds without removing unrelated filters or the other bound", () => {
    expect(
      applyFaceValueRangeSearch(currentSearch, {
        minValue: "",
        maxValue: "2",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxValue: 2,
      maxWeight: 8.75,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })

    expect(
      applyFaceValueRangeSearch(currentSearch, {
        minValue: "0.5",
        maxValue: " ",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      minDiameter: 20.25,
      minThickness: 1.25,
      minValue: 0.5,
      minWeight: 4.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })

  it("ignores invalid requested face value inputs instead of dropping the current bounds", () => {
    expect(
      applyFaceValueRangeSearch(currentSearch, {
        minValue: "invalid",
        maxValue: "0",
      })
    ).toStrictEqual(currentSearch)
  })
})

describe("coinSearchSchema", () => {
  it("keeps homepage search parsing free of runtime database package imports", () => {
    const source = readFileSync(new URL("./coin-search.ts", import.meta.url), {
      encoding: "utf8",
    })

    const runtimeDatabaseImports = source
      .split("\n")
      .filter((line) => line.startsWith("import "))
      .filter((line) => !line.startsWith("import type "))
      .filter((line) => line.includes('"@workspace/db"'))

    expect(runtimeDatabaseImports).toStrictEqual([])
  })

  it("defines the explicit homepage Demonetization Status options", () => {
    expect(demonetizationFilterOptions).toStrictEqual([
      { code: "demonetized", name: "Demonetized" },
      { code: "not-demonetized", name: "Not demonetized" },
      { code: "unknown", name: "Unknown" },
    ])
  })

  it("accepts homepage catalogue, currency, edge, face value, issue year range, measurement, Minting Technique, theme, and reference number search params", () => {
    expect(
      coinSearchSchema.parse({
        catalogue: "km",
        composition: "silver-900",
        currency: "euro",
        demonetization: "not-demonetized",
        distribution: "circulating-commemorative",
        edge: "reeded",
        fromYear: "1898",
        issuer: "spain",
        maxDiameter: "30.5",
        maxThickness: "2.5",
        maxWeight: "8.75",
        maxValue: "2",
        mint: "royal-mint-of-madrid",
        minDiameter: "20.25",
        minThickness: "1.25",
        minWeight: "4.5",
        minValue: "0.5",
        referenceNumber: "1338A",
        ruler: "felipe-vi",
        technique: "milled",
        theme: "map",
        toYear: "1902",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      currency: "euro",
      demonetization: "not-demonetized",
      distribution: "circulating-commemorative",
      edge: "reeded",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      maxValue: 2,
      mint: "royal-mint-of-madrid",
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      minValue: 0.5,
      referenceNumber: "1338A",
      ruler: "felipe-vi",
      technique: "milled",
      theme: "map",
      toYear: 1902,
    })
  })

  it("treats blank face value, issue year, and measurement params as undefined", () => {
    expect(
      coinSearchSchema.parse({
        fromYear: "",
        maxDiameter: "  ",
        maxValue: "",
        minWeight: "",
        minValue: "  ",
        toYear: "  ",
      })
    ).toStrictEqual({
      fromYear: undefined,
      maxDiameter: undefined,
      maxValue: undefined,
      minWeight: undefined,
      minValue: undefined,
      toYear: undefined,
    })
  })

  it.each([
    ["mintage", "1234567"],
    ["comments", "Public catalogue note."],
  ] as const)("ignores a %s homepage search param", (paramName, paramValue) => {
    expect(
      coinSearchSchema.parse({
        issuer: "spain",
        [paramName]: paramValue,
      })
    ).toStrictEqual({
      issuer: "spain",
    })
  })

  it("accepts singular shape, rim, and Minting Technique homepage search params", () => {
    expect(
      coinSearchSchema.parse({
        shape: "round",
        rim: "raised-both-sides",
        technique: "milled",
      })
    ).toStrictEqual({
      rim: "raised-both-sides",
      shape: "round",
      technique: "milled",
    })
  })

  it("accepts a singular engraver homepage search param", () => {
    expect(
      coinSearchSchema.parse({
        engraver: "georgios-stamatopoulos",
      })
    ).toStrictEqual({
      engraver: "georgios-stamatopoulos",
    })
  })

  it("accepts valid homepage Demonetization Status values and ignores blank or invalid values", () => {
    expect(
      coinSearchSchema.parse({
        demonetization: "demonetized",
      })
    ).toStrictEqual({
      demonetization: "demonetized",
    })

    expect(
      coinSearchSchema.parse({
        demonetization: "",
      })
    ).toStrictEqual({
      demonetization: undefined,
    })

    expect(
      coinSearchSchema.parse({
        demonetization: "  ",
      })
    ).toStrictEqual({
      demonetization: undefined,
    })

    expect(
      coinSearchSchema.parse({
        demonetization: "still-legal-tender",
      })
    ).toStrictEqual({
      demonetization: undefined,
    })
  })
})

describe("getCoinListLoaderDeps", () => {
  it("passes homepage currency, demonetization, edge, mint, theme, engraver, face value, issue year, measurement, distribution, catalogue, reference number, issuer, and ruler filters to the coin listing boundary", () => {
    expect(
      getCoinListLoaderDeps({
        ...currentSearchWithDemonetization,
        edge: "reeded",
        engraver: "georgios-stamatopoulos",
        mint: "royal-mint-of-madrid",
        orientation: "coin-alignment",
        rim: "raised-both-sides",
        shape: "round",
        technique: "milled",
        theme: "map",
      })
    ).toStrictEqual({
      ...baseCoinListLoaderDeps,
      demonetization: "unknown",
      edgeCode: "reeded",
      engraverCode: "georgios-stamatopoulos",
      mintCode: "royal-mint-of-madrid",
      orientationCode: "coin-alignment",
      rimCode: "raised-both-sides",
      shapeCode: "round",
      techniqueCode: "milled",
      themeCode: "map",
    })
  })

  it("passes the homepage Demonetization Status filter to the coin listing boundary", () => {
    expect(
      getCoinListLoaderDeps({
        demonetization: "unknown",
      })
    ).toMatchObject({
      demonetization: "unknown",
    })
  })

  it("does not forward mintage to the coin listing boundary", () => {
    const deps = getCoinListLoaderDepsWithUnexpectedSearchParam({
      ...currentSearch,
      mintage: "1234567",
    })

    expect(deps).not.toHaveProperty("mintage")
    expect(deps).toMatchObject(baseCoinListLoaderDeps)
  })

  it("does not forward comments to the coin listing boundary", () => {
    const deps = getCoinListLoaderDepsWithUnexpectedSearchParam({
      ...currentSearch,
      comments: "Public catalogue note.",
    })

    expect(deps).not.toHaveProperty("comments")
    expect(deps).toMatchObject(baseCoinListLoaderDeps)
  })
})

describe("findSelectedDemonetizationFilterOption", () => {
  it("returns the selected explicit homepage demonetization option", () => {
    expect(
      findSelectedDemonetizationFilterOption("not-demonetized")
    ).toStrictEqual(demonetizationFilterOptions[1])
  })

  it("returns null when no demonetization filter is selected", () => {
    expect(findSelectedDemonetizationFilterOption(undefined)).toBeNull()
  })
})

describe("formatIssueYearRangeLabel", () => {
  it.each([
    [{ minYear: -43, maxYear: -43 }, "Issue year 44 BCE"],
    [{ minYear: -1, maxYear: 0 }, "Issue years 2 BCE to 1 BCE"],
    [{ minYear: 1, maxYear: 1 }, "Issue year 1 CE"],
    [{ minYear: 1898, maxYear: 1902 }, "Issue years 1898 CE to 1902 CE"],
  ])(
    "formats astronomical issue years into human-readable BCE and CE labels for %j",
    (issueYearRange, expectedLabel) => {
      expect(formatIssueYearRangeLabel(issueYearRange)).toBe(expectedLabel)
    }
  )

  it("keeps the unknown issue year copy when no range is stored", () => {
    expect(formatIssueYearRangeLabel(null)).toBe("Issue years unknown")
  })
})

describe("formatMeasurementLabel", () => {
  it("formats known measurements with two decimals and units", () => {
    expect(formatMeasurementLabel("Weight", 4.5, "g")).toBe("Weight 4.50 g")
    expect(formatMeasurementLabel("Diameter", 19.25, "mm")).toBe(
      "Diameter 19.25 mm"
    )
  })

  it("omits unknown individual measurements", () => {
    expect(formatMeasurementLabel("Thickness", null, "mm")).toBeNull()
  })
})

describe("getCatalogueOptionLabel", () => {
  it("includes catalogue title and code so combobox search can match both", () => {
    expect(
      getCatalogueOptionLabel({
        code: "KM",
        title: "Standard Catalog of World Coins",
      })
    ).toBe("Standard Catalog of World Coins · KM")
  })
})

describe("getDistributionOptionLabel", () => {
  it("includes distribution name and code so combobox search can match both", () => {
    expect(
      getDistributionOptionLabel({
        code: "circulating-commemorative",
        name: "Circulating commemorative",
      })
    ).toBe("Circulating commemorative · circulating-commemorative")
  })
})

describe("getCompositionOptionLabel", () => {
  it("returns only the composition name for homepage combobox display", () => {
    expect(
      getCompositionOptionLabel({
        name: "Silver (.900)",
      })
    ).toBe("Silver (.900)")
  })
})

describe("getCurrencyOptionLabel", () => {
  it("includes currency name and code so combobox search can match both", () => {
    expect(
      getCurrencyOptionLabel({
        code: "euro",
        name: "Euro",
      })
    ).toBe("Euro · euro")
  })
})

describe("getEdgeOptionLabel", () => {
  it("includes edge name and code so combobox search can match both", () => {
    expect(
      getEdgeOptionLabel({
        code: "reeded",
        name: "Reeded",
      })
    ).toBe("Reeded · reeded")
  })
})

describe("getEngraverOptionLabel", () => {
  it("includes engraver name and code so combobox search can match both", () => {
    expect(
      getEngraverOptionLabel({
        code: "georgios-stamatopoulos",
        name: "Georgios Stamatopoulos",
      })
    ).toBe("Georgios Stamatopoulos · georgios-stamatopoulos")
  })
})

describe("getMintOptionLabel", () => {
  it("includes mint name and code so combobox search can match both", () => {
    expect(
      getMintOptionLabel({
        code: "royal-mint-of-madrid",
        name: "Royal Mint of Madrid",
      })
    ).toBe("Royal Mint of Madrid · royal-mint-of-madrid")
  })
})

describe("getOrientationOptionLabel", () => {
  it("includes orientation name and code so combobox search can match both", () => {
    expect(
      getOrientationOptionLabel({
        code: "coin-alignment",
        name: "Coin alignment",
      })
    ).toBe("Coin alignment · coin-alignment")
  })
})

describe("getThemeOptionLabel", () => {
  it("includes theme name and code so combobox search can match both", () => {
    expect(
      getThemeOptionLabel({
        code: "map",
        name: "Map",
      })
    ).toBe("Map · map")
  })
})

describe("getShapeOptionLabel", () => {
  it("includes shape name and code so combobox search can match both", () => {
    expect(
      getShapeOptionLabel({
        code: "round",
        name: "Round",
      })
    ).toBe("Round · round")
  })
})

describe("getRimOptionLabel", () => {
  it("includes rim name and code so combobox search can match both", () => {
    expect(
      getRimOptionLabel({
        code: "raised-both-sides",
        name: "Raised, both sides",
      })
    ).toBe("Raised, both sides · raised-both-sides")
  })
})

describe("findSelectedCatalogueOption", () => {
  it("matches the selected catalogue code case-insensitively", () => {
    const standardCatalog = {
      code: "KM",
      title: "Standard Catalog of World Coins",
    }

    expect(findSelectedCatalogueOption([standardCatalog], "km")).toStrictEqual(
      standardCatalog
    )
  })
})

describe("findSelectedDistributionOption", () => {
  it("matches the selected distribution code case-insensitively", () => {
    const circulatingCommemorative = {
      code: "circulating-commemorative",
      name: "Circulating commemorative",
    }

    expect(
      findSelectedDistributionOption(
        [circulatingCommemorative],
        "CIRCULATING-COMMEMORATIVE"
      )
    ).toStrictEqual(circulatingCommemorative)
  })
})

describe("findSelectedEdgeOption", () => {
  it("matches the selected edge code case-insensitively", () => {
    const reeded = {
      code: "reeded",
      name: "Reeded",
    }

    expect(findSelectedEdgeOption([reeded], "REEDED")).toStrictEqual(reeded)
  })
})

describe("findSelectedEngraverOption", () => {
  it("matches the selected engraver code case-insensitively", () => {
    const georgiosStamatopoulos = {
      code: "georgios-stamatopoulos",
      name: "Georgios Stamatopoulos",
    }

    expect(
      findSelectedEngraverOption(
        [georgiosStamatopoulos],
        "GEORGIOS-STAMATOPOULOS"
      )
    ).toStrictEqual(georgiosStamatopoulos)
  })
})

describe("findSelectedIssuerOption", () => {
  it("matches the selected issuer code case-insensitively", () => {
    const spain = {
      code: "spain",
      name: "Spain",
    }

    expect(findSelectedIssuerOption([spain], "SPAIN")).toStrictEqual(spain)
  })

  it("returns null when the selected issuer code does not match", () => {
    const spain = {
      code: "spain",
      name: "Spain",
    }

    expect(findSelectedIssuerOption([spain], "france")).toBeNull()
  })

  it("returns null when the selected issuer code is undefined or empty", () => {
    const spain = {
      code: "spain",
      name: "Spain",
    }

    expect(findSelectedIssuerOption([spain], undefined)).toBeNull()
    expect(findSelectedIssuerOption([spain], "")).toBeNull()
  })
})

describe("findSelectedCompositionOption", () => {
  it("matches the selected composition code case-insensitively", () => {
    const silver900 = {
      code: "silver-900",
      name: "Silver (.900)",
    }

    expect(
      findSelectedCompositionOption([silver900], "SILVER-900")
    ).toStrictEqual(silver900)
  })
})

describe("findSelectedCurrencyOption", () => {
  it("matches the selected currency code case-insensitively", () => {
    const euro = {
      code: "euro",
      fullName: "Euro (2002-date)",
      name: "Euro",
    }

    expect(findSelectedCurrencyOption([euro], "EURO")).toStrictEqual(euro)
  })
})

describe("findSelectedMintOption", () => {
  it("matches the selected mint code case-insensitively", () => {
    const royalMintOfMadrid = {
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    }

    expect(
      findSelectedMintOption([royalMintOfMadrid], "ROYAL-MINT-OF-MADRID")
    ).toStrictEqual(royalMintOfMadrid)
  })
})

describe("findSelectedOrientationOption", () => {
  it("matches the selected orientation code case-insensitively", () => {
    const coinAlignment = {
      code: "coin-alignment",
      name: "Coin alignment",
    }

    expect(
      findSelectedOrientationOption([coinAlignment], "COIN-ALIGNMENT")
    ).toStrictEqual(coinAlignment)
  })
})

describe("findSelectedThemeOption", () => {
  it("matches the selected theme code case-insensitively", () => {
    const map = {
      code: "map",
      name: "Map",
    }

    expect(findSelectedThemeOption([map], "MAP")).toStrictEqual(map)
  })
})

describe("findSelectedTechniqueOption", () => {
  it("matches the selected technique code case-insensitively", () => {
    const milled = {
      code: "milled",
      name: "Milled",
    }

    expect(findSelectedTechniqueOption([milled], "MILLED")).toStrictEqual(
      milled
    )
  })
})

describe("findSelectedShapeOption", () => {
  it("matches the selected shape code case-insensitively", () => {
    const round = {
      code: "round",
      name: "Round",
    }

    expect(findSelectedShapeOption([round], "ROUND")).toStrictEqual(round)
  })
})

describe("findSelectedRulerOption", () => {
  it("matches the selected ruler code case-insensitively", () => {
    const felipe = {
      code: "felipe-vi",
      name: "Felipe VI",
    }

    expect(findSelectedRulerOption([felipe], "FELIPE-VI")).toStrictEqual(felipe)
  })

  it("returns null when the selected ruler code does not match", () => {
    const felipe = {
      code: "felipe-vi",
      name: "Felipe VI",
    }

    expect(findSelectedRulerOption([felipe], "juan-carlos-i")).toBeNull()
  })

  it("returns null when the selected ruler code is undefined or empty", () => {
    const felipe = {
      code: "felipe-vi",
      name: "Felipe VI",
    }

    expect(findSelectedRulerOption([felipe], undefined)).toBeNull()
    expect(findSelectedRulerOption([felipe], "")).toBeNull()
  })
})

describe("findSelectedRimOption", () => {
  it("matches the selected rim code case-insensitively", () => {
    const raisedBothSides = {
      code: "raised-both-sides",
      name: "Raised, both sides",
    }

    expect(
      findSelectedRimOption([raisedBothSides], "RAISED-BOTH-SIDES")
    ).toStrictEqual(raisedBothSides)
  })
})

describe("getTechniqueOptionLabel", () => {
  it("includes the Minting Technique name and code so combobox search can match both", () => {
    expect(
      getTechniqueOptionLabel({
        code: "milled",
        name: "Milled",
      })
    ).toBe("Milled · milled")
  })
})
