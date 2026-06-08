import { describe, expect, it } from "vitest"

import {
  applyFaceValueRangeSearch,
  applyIssueYearRangeSearch,
  applyMeasurementRangeSearch,
  coinSearchSchema,
  findSelectedCatalogueOption,
  findSelectedCompositionOption,
  findSelectedCurrencyOption,
  findSelectedDistributionOption,
  findSelectedMintOption,
  findSelectedOrientationOption,
  findSelectedThemeOption,
  formatMintNames,
  formatIssueYearRangeLabel,
  formatMeasurementLabel,
  getCatalogueOptionLabel,
  getCompositionOptionLabel,
  getCurrencyOptionLabel,
  getDistributionOptionLabel,
  getMintOptionLabel,
  getOrientationOptionLabel,
  getThemeOptionLabel,
  getCoinListLoaderDeps,
  updateCoinSearchFilter,
} from "./coin-search"

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
}

const currentSearchWithMint = {
  ...currentSearch,
  mint: "royal-mint-of-madrid",
}

const currentSearchWithOrientation = {
  ...currentSearch,
  orientation: "coin-alignment",
}

const currentSearchWithTheme = {
  ...currentSearch,
  theme: "map",
}

const emptyFilterValues = [undefined, ""] as const

function omitFilter<T extends object, K extends keyof T>(
  search: T,
  filterName: K
): Omit<T, K> {
  const { [filterName]: _removedFilter, ...remainingSearch } = search

  return remainingSearch
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
    "clears the theme filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearchWithTheme, "theme", filterValue)
      ).toStrictEqual(omitFilter(currentSearchWithTheme, "theme"))
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
  it("accepts homepage catalogue, currency, face value, issue year range, measurement, theme, and reference number search params", () => {
    expect(
      coinSearchSchema.parse({
        catalogue: "km",
        composition: "silver-900",
        currency: "euro",
        distribution: "circulating-commemorative",
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
        theme: "map",
        toYear: "1902",
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
      mint: "royal-mint-of-madrid",
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      minValue: 0.5,
      referenceNumber: "1338A",
      ruler: "felipe-vi",
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
})

describe("getCoinListLoaderDeps", () => {
  it("passes homepage currency, mint, theme, face value, issue year, measurement, distribution, catalogue, reference number, issuer, and ruler filters to the coin listing boundary", () => {
    expect(
      getCoinListLoaderDeps({
        ...currentSearch,
        mint: "royal-mint-of-madrid",
        orientation: "coin-alignment",
        theme: "map",
      })
    ).toStrictEqual({
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
      mintCode: "royal-mint-of-madrid",
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      minValue: 0.5,
      orientationCode: "coin-alignment",
      referenceNumber: "1338",
      rulerCode: "felipe-vi",
      themeCode: "map",
      toYear: 1902,
    })
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
