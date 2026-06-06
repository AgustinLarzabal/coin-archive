import { describe, expect, it } from "vitest"

import {
  applyDiameterRangeSearch,
  applyIssueYearRangeSearch,
  applyThicknessRangeSearch,
  applyWeightRangeSearch,
  type CoinSearchFilterName,
  coinListInputSchema,
  coinSearchSchema,
  findSelectedCatalogueOption,
  findSelectedDistributionOption,
  formatCoinMeasurementsLabel,
  formatIssueYearRangeLabel,
  getCatalogueOptionLabel,
  getDistributionOptionLabel,
  getCoinListLoaderDeps,
  updateCoinSearchFilter,
} from "./coin-search"

const currentSearch = {
  catalogue: "km",
  distribution: "circulating-commemorative",
  fromYear: 1898,
  issuer: "spain",
  maxWeight: 28.75,
  minWeight: 25.5,
  maxDiameter: 28.75,
  minDiameter: 25.5,
  maxThickness: 3.4,
  minThickness: 1.25,
  referenceNumber: "1338",
  ruler: "felipe-vi",
  toYear: 1902,
}

function searchWithout(...filterNames: CoinSearchFilterName[]) {
  const nextSearch = { ...currentSearch }

  for (const filterName of filterNames) {
    delete nextSearch[filterName]
  }

  return nextSearch
}

describe("updateCoinSearchFilter", () => {
  it.each([
    "issuer",
    "distribution",
    "ruler",
    "referenceNumber",
    "fromYear",
    "toYear",
    "minWeight",
    "maxWeight",
    "minDiameter",
    "maxDiameter",
    "minThickness",
    "maxThickness",
  ] as const)(
    "clears only the %s filter when the value is empty",
    (filterName) => {
      expect(
        updateCoinSearchFilter(currentSearch, filterName, undefined)
      ).toStrictEqual(searchWithout(filterName))
      expect(
        updateCoinSearchFilter(currentSearch, filterName, "")
      ).toStrictEqual(searchWithout(filterName))
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
      ...currentSearch,
      fromYear: -43,
      toYear: 0,
    })

    expect(
      applyIssueYearRangeSearch(currentSearch, {
        fromYear: "1900",
        toYear: "",
      })
    ).toStrictEqual({
      ...searchWithout("toYear"),
      fromYear: 1900,
    })
  })

  it("clears either requested year bound without removing unrelated filters or the other bound", () => {
    expect(
      applyIssueYearRangeSearch(currentSearch, {
        fromYear: "",
        toYear: "1902",
      })
    ).toStrictEqual(searchWithout("fromYear"))

    expect(
      applyIssueYearRangeSearch(currentSearch, {
        fromYear: "1898",
        toYear: " ",
      })
    ).toStrictEqual(searchWithout("toYear"))
  })

  it("ignores invalid requested year inputs instead of dropping the current bounds", () => {
    expect(
      applyIssueYearRangeSearch(currentSearch, {
        fromYear: "nineteen hundred",
        toYear: "1900",
      })
    ).toStrictEqual({
      ...currentSearch,
      toYear: 1900,
    })
  })
})

describe("applyWeightRangeSearch", () => {
  it("applies exact and open weight windows while preserving unrelated filters", () => {
    expect(
      applyWeightRangeSearch(currentSearch, {
        maxWeight: "28.75",
        minWeight: "25.50",
      })
    ).toStrictEqual(currentSearch)

    expect(
      applyWeightRangeSearch(currentSearch, {
        maxWeight: "",
        minWeight: "27",
      })
    ).toStrictEqual({
      ...searchWithout("maxWeight"),
      minWeight: 27,
    })
  })

  it("clears either requested weight bound without removing unrelated filters or the other bound", () => {
    expect(
      applyWeightRangeSearch(currentSearch, {
        maxWeight: "28.75",
        minWeight: "",
      })
    ).toStrictEqual(searchWithout("minWeight"))

    expect(
      applyWeightRangeSearch(currentSearch, {
        maxWeight: " ",
        minWeight: "25.50",
      })
    ).toStrictEqual(searchWithout("maxWeight"))
  })

  it("ignores invalid requested weight inputs instead of dropping the current bounds", () => {
    expect(
      applyWeightRangeSearch(currentSearch, {
        maxWeight: "28.75",
        minWeight: "twenty-five",
      })
    ).toStrictEqual(currentSearch)
  })
})

describe("applyDiameterRangeSearch", () => {
  it("applies exact and open diameter windows while preserving unrelated filters", () => {
    expect(
      applyDiameterRangeSearch(currentSearch, {
        maxDiameter: "28.75",
        minDiameter: "25.50",
      })
    ).toStrictEqual(currentSearch)

    expect(
      applyDiameterRangeSearch(currentSearch, {
        maxDiameter: "",
        minDiameter: "27",
      })
    ).toStrictEqual({
      ...searchWithout("maxDiameter"),
      minDiameter: 27,
    })
  })

  it("clears either requested diameter bound without removing unrelated filters or the other bound", () => {
    expect(
      applyDiameterRangeSearch(currentSearch, {
        maxDiameter: "28.75",
        minDiameter: "",
      })
    ).toStrictEqual(searchWithout("minDiameter"))

    expect(
      applyDiameterRangeSearch(currentSearch, {
        maxDiameter: " ",
        minDiameter: "25.50",
      })
    ).toStrictEqual(searchWithout("maxDiameter"))
  })

  it("ignores invalid requested diameter inputs instead of dropping the current bounds", () => {
    expect(
      applyDiameterRangeSearch(currentSearch, {
        maxDiameter: "28.75",
        minDiameter: "twenty-five",
      })
    ).toStrictEqual(currentSearch)
  })
})

describe("applyThicknessRangeSearch", () => {
  it("applies exact and open thickness windows while preserving unrelated filters", () => {
    expect(
      applyThicknessRangeSearch(currentSearch, {
        maxThickness: "3.40",
        minThickness: "1.25",
      })
    ).toStrictEqual(currentSearch)

    expect(
      applyThicknessRangeSearch(currentSearch, {
        maxThickness: "",
        minThickness: "2",
      })
    ).toStrictEqual({
      ...searchWithout("maxThickness"),
      minThickness: 2,
    })
  })

  it("clears either requested thickness bound without removing unrelated filters or the other bound", () => {
    expect(
      applyThicknessRangeSearch(currentSearch, {
        maxThickness: "3.40",
        minThickness: "",
      })
    ).toStrictEqual(searchWithout("minThickness"))

    expect(
      applyThicknessRangeSearch(currentSearch, {
        maxThickness: " ",
        minThickness: "1.25",
      })
    ).toStrictEqual(searchWithout("maxThickness"))
  })

  it("ignores invalid requested thickness inputs instead of dropping the current bounds", () => {
    expect(
      applyThicknessRangeSearch(currentSearch, {
        maxThickness: "3.40",
        minThickness: "thick",
      })
    ).toStrictEqual(currentSearch)
  })
})

describe("coinSearchSchema", () => {
  it("accepts homepage catalogue, issue year, measurement range, and reference number search params", () => {
    expect(
      coinSearchSchema.parse({
        catalogue: "km",
        distribution: "circulating-commemorative",
        fromYear: "1898",
        issuer: "spain",
        maxWeight: "28.75",
        minWeight: "25.50",
        maxDiameter: "28.75",
        minDiameter: "25.50",
        maxThickness: "3.40",
        minThickness: "1.25",
        referenceNumber: "1338A",
        ruler: "felipe-vi",
        toYear: "1902",
      })
    ).toStrictEqual({
      catalogue: "km",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxWeight: 28.75,
      minWeight: 25.5,
      maxDiameter: 28.75,
      minDiameter: 25.5,
      maxThickness: 3.4,
      minThickness: 1.25,
      referenceNumber: "1338A",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })

  it("treats blank numeric params as undefined", () => {
    expect(
      coinSearchSchema.parse({
        fromYear: "",
        maxWeight: "",
        minWeight: "  ",
        maxDiameter: "",
        minDiameter: "  ",
        maxThickness: " ",
        minThickness: "",
        toYear: "  ",
      })
    ).toStrictEqual({
      fromYear: undefined,
      maxWeight: undefined,
      minWeight: undefined,
      maxDiameter: undefined,
      minDiameter: undefined,
      maxThickness: undefined,
      minThickness: undefined,
      toYear: undefined,
    })
  })
})

describe("getCoinListLoaderDeps", () => {
  it("passes homepage filters to the coin listing boundary", () => {
    expect(getCoinListLoaderDeps(currentSearch)).toStrictEqual({
      catalogueCode: "km",
      distributionCode: "circulating-commemorative",
      fromYear: 1898,
      issuerCode: "spain",
      maxWeight: 28.75,
      minWeight: 25.5,
      maxDiameter: 28.75,
      minDiameter: 25.5,
      maxThickness: 3.4,
      minThickness: 1.25,
      referenceNumber: "1338",
      rulerCode: "felipe-vi",
      toYear: 1902,
    })
  })

  it("returns loader deps that satisfy the shared coin list input schema", () => {
    const loaderDeps = getCoinListLoaderDeps({
      catalogue: "km",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxWeight: 28.75,
      maxDiameter: 28.75,
      minWeight: 25.5,
      minDiameter: 25.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })

    expect(coinListInputSchema.parse(loaderDeps)).toStrictEqual(loaderDeps)
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

describe("formatCoinMeasurementsLabel", () => {
  it("formats known measurements with units and omits unknown individual values", () => {
    expect(
      formatCoinMeasurementsLabel({
        weight: "26.73",
        diameter: "38.10",
        thickness: null,
      })
    ).toBe("Weight 26.73 g · Diameter 38.10 mm")

    expect(
      formatCoinMeasurementsLabel({
        weight: null,
        diameter: null,
        thickness: "2.40",
      })
    ).toBe("Thickness 2.40 mm")
  })

  it("returns null when all measurements are unknown", () => {
    expect(
      formatCoinMeasurementsLabel({
        weight: null,
        diameter: null,
        thickness: null,
      })
    ).toBeNull()
  })
})

describe("option labels", () => {
  it("formats catalogue, distribution, and lookup selections consistently", () => {
    expect(
      findSelectedCatalogueOption([{ code: "KM", id: "1" }], "km")
    ).toStrictEqual({ code: "KM", id: "1" })
    expect(
      findSelectedDistributionOption([{ code: "COM", id: "1" }], "com")
    ).toStrictEqual({ code: "COM", id: "1" })
    expect(
      getCatalogueOptionLabel({
        code: "KM",
        title: "Standard Catalog of World Coins",
      })
    ).toBe("Standard Catalog of World Coins · KM")
    expect(
      getDistributionOptionLabel({
        code: "COM",
        name: "Commemorative",
      })
    ).toBe("Commemorative · COM")
  })
})
