import { describe, expect, it } from "vitest"

import {
  applyDiameterRangeSearch,
  applyIssueYearRangeSearch,
  type CoinSearchFilterName,
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
  maxDiameter: 28.75,
  minDiameter: 25.5,
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
  it("clears only the selected filter and preserves unrelated search params", () => {
    expect(
      updateCoinSearchFilter(currentSearch, "issuer", undefined)
    ).toStrictEqual(searchWithout("issuer"))
  })

  it.each([undefined, ""] as const)(
    "clears the distribution filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "distribution", filterValue)
      ).toStrictEqual(searchWithout("distribution"))
    }
  )

  it.each([undefined, ""] as const)(
    "clears the ruler filter without removing the issuer filter when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "ruler", filterValue)
      ).toStrictEqual(searchWithout("ruler"))
    }
  )

  it.each([undefined, ""] as const)(
    "clears the reference number filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "referenceNumber", filterValue)
      ).toStrictEqual(searchWithout("referenceNumber"))
    }
  )

  it.each([undefined, ""] as const)(
    "clears the fromYear filter without removing unrelated filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "fromYear", filterValue)
      ).toStrictEqual(searchWithout("fromYear"))
    }
  )

  it.each([undefined, ""] as const)(
    "clears the toYear filter without removing unrelated filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "toYear", filterValue)
      ).toStrictEqual(searchWithout("toYear"))
    }
  )

  it.each([undefined, ""] as const)(
    "clears the minDiameter filter without removing unrelated filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "minDiameter", filterValue)
      ).toStrictEqual(searchWithout("minDiameter"))
    }
  )

  it.each([undefined, ""] as const)(
    "clears the maxDiameter filter without removing unrelated filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "maxDiameter", filterValue)
      ).toStrictEqual(searchWithout("maxDiameter"))
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
      distribution: "circulating-commemorative",
      fromYear: -43,
      issuer: "spain",
      maxDiameter: 28.75,
      minDiameter: 25.5,
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
      distribution: "circulating-commemorative",
      fromYear: 1900,
      issuer: "spain",
      maxDiameter: 28.75,
      minDiameter: 25.5,
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
      distribution: "circulating-commemorative",
      issuer: "spain",
      maxDiameter: 28.75,
      minDiameter: 25.5,
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
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 28.75,
      minDiameter: 25.5,
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
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 28.75,
      minDiameter: 25.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1900,
    })
  })
})

describe("applyDiameterRangeSearch", () => {
  it("applies exact and open diameter windows while preserving unrelated filters", () => {
    expect(
      applyDiameterRangeSearch(currentSearch, {
        maxDiameter: "28.75",
        minDiameter: "25.50",
      })
    ).toStrictEqual({
      catalogue: "km",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 28.75,
      minDiameter: 25.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })

    expect(
      applyDiameterRangeSearch(currentSearch, {
        maxDiameter: "",
        minDiameter: "27",
      })
    ).toStrictEqual({
      catalogue: "km",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      minDiameter: 27,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })

  it("clears either requested diameter bound without removing unrelated filters or the other bound", () => {
    expect(
      applyDiameterRangeSearch(currentSearch, {
        maxDiameter: "28.75",
        minDiameter: "",
      })
    ).toStrictEqual({
      catalogue: "km",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 28.75,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })

    expect(
      applyDiameterRangeSearch(currentSearch, {
        maxDiameter: " ",
        minDiameter: "25.50",
      })
    ).toStrictEqual({
      catalogue: "km",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      minDiameter: 25.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })

  it("ignores invalid requested diameter inputs instead of dropping the current bounds", () => {
    expect(
      applyDiameterRangeSearch(currentSearch, {
        maxDiameter: "28.75",
        minDiameter: "twenty-five",
      })
    ).toStrictEqual({
      catalogue: "km",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 28.75,
      minDiameter: 25.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })
})

describe("coinSearchSchema", () => {
  it("accepts homepage catalogue, issue year range, diameter range, and reference number search params", () => {
    expect(
      coinSearchSchema.parse({
        catalogue: "km",
        distribution: "circulating-commemorative",
        fromYear: "1898",
        issuer: "spain",
        maxDiameter: "28.75",
        minDiameter: "25.50",
        referenceNumber: "1338A",
        ruler: "felipe-vi",
        toYear: "1902",
      })
    ).toStrictEqual({
      catalogue: "km",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 28.75,
      minDiameter: 25.5,
      referenceNumber: "1338A",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })

  it("treats blank issue year and diameter params as undefined", () => {
    expect(
      coinSearchSchema.parse({
        fromYear: "",
        maxDiameter: "",
        minDiameter: "  ",
        toYear: "  ",
      })
    ).toStrictEqual({
      fromYear: undefined,
      maxDiameter: undefined,
      minDiameter: undefined,
      toYear: undefined,
    })
  })
})

describe("getCoinListLoaderDeps", () => {
  it("passes homepage issue year, diameter, distribution, catalogue, reference number, issuer, and ruler filters to the coin listing boundary", () => {
    expect(
      getCoinListLoaderDeps({
        catalogue: "km",
        distribution: "circulating-commemorative",
        fromYear: 1898,
        issuer: "spain",
        maxDiameter: 28.75,
        minDiameter: 25.5,
        referenceNumber: "1338",
        ruler: "felipe-vi",
        toYear: 1902,
      })
    ).toStrictEqual({
      catalogueCode: "km",
      distributionCode: "circulating-commemorative",
      fromYear: 1898,
      issuerCode: "spain",
      maxDiameter: 28.75,
      minDiameter: 25.5,
      referenceNumber: "1338",
      rulerCode: "felipe-vi",
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
