import { describe, expect, it } from "vitest"

import {
  applyIssueYearRangeSearch,
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
  referenceNumber: "1338",
  ruler: "felipe-vi",
  toYear: 1902,
}

describe("updateCoinSearchFilter", () => {
  it("clears only the selected filter and preserves unrelated search params", () => {
    expect(
      updateCoinSearchFilter(currentSearch, "issuer", undefined)
    ).toStrictEqual({
      catalogue: "km",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })

  it.each([undefined, ""])(
    "clears the distribution filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "distribution", filterValue)
      ).toStrictEqual({
        catalogue: "km",
        fromYear: 1898,
        issuer: "spain",
        referenceNumber: "1338",
        ruler: "felipe-vi",
        toYear: 1902,
      })
    }
  )

  it.each([undefined, ""])(
    "clears the ruler filter without removing the issuer filter when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "ruler", filterValue)
      ).toStrictEqual({
        catalogue: "km",
        distribution: "circulating-commemorative",
        fromYear: 1898,
        issuer: "spain",
        referenceNumber: "1338",
        toYear: 1902,
      })
    }
  )

  it.each([undefined, ""])(
    "clears the reference number filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "referenceNumber", filterValue)
      ).toStrictEqual({
        catalogue: "km",
        distribution: "circulating-commemorative",
        fromYear: 1898,
        issuer: "spain",
        ruler: "felipe-vi",
        toYear: 1902,
      })
    }
  )

  it.each<["" | undefined]>([[undefined], [""]])(
    "clears the fromYear filter without removing unrelated filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "fromYear", filterValue)
      ).toStrictEqual({
        catalogue: "km",
        distribution: "circulating-commemorative",
        issuer: "spain",
        referenceNumber: "1338",
        ruler: "felipe-vi",
        toYear: 1902,
      })
    }
  )

  it.each<["" | undefined]>([[undefined], [""]])(
    "clears the toYear filter without removing unrelated filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "toYear", filterValue)
      ).toStrictEqual({
        catalogue: "km",
        distribution: "circulating-commemorative",
        fromYear: 1898,
        issuer: "spain",
        referenceNumber: "1338",
        ruler: "felipe-vi",
      })
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
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1900,
    })
  })
})

describe("coinSearchSchema", () => {
  it("accepts homepage catalogue, issue year range, and reference number search params", () => {
    expect(
      coinSearchSchema.parse({
        catalogue: "km",
        distribution: "circulating-commemorative",
        fromYear: "1898",
        issuer: "spain",
        referenceNumber: "1338A",
        ruler: "felipe-vi",
        toYear: "1902",
      })
    ).toStrictEqual({
      catalogue: "km",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      referenceNumber: "1338A",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })

  it("treats blank issue year params as undefined", () => {
    expect(
      coinSearchSchema.parse({
        fromYear: "",
        toYear: "  ",
      })
    ).toStrictEqual({
      fromYear: undefined,
      toYear: undefined,
    })
  })
})

describe("getCoinListLoaderDeps", () => {
  it("passes homepage issue year, distribution, catalogue, reference number, issuer, and ruler filters to the coin listing boundary", () => {
    expect(
      getCoinListLoaderDeps({
        catalogue: "km",
        distribution: "circulating-commemorative",
        fromYear: 1898,
        issuer: "spain",
        referenceNumber: "1338",
        ruler: "felipe-vi",
        toYear: 1902,
      })
    ).toStrictEqual({
      catalogueCode: "km",
      distributionCode: "circulating-commemorative",
      fromYear: 1898,
      issuerCode: "spain",
      referenceNumber: "1338",
      rulerCode: "felipe-vi",
      toYear: 1902,
    })
  })
})

describe("formatIssueYearRangeLabel", () => {
  it.each([
    [
      { minYear: -43, maxYear: -43 },
      "Issue year 44 BCE",
    ],
    [
      { minYear: -1, maxYear: 0 },
      "Issue years 2 BCE to 1 BCE",
    ],
    [
      { minYear: 1, maxYear: 1 },
      "Issue year 1 CE",
    ],
    [
      { minYear: 1898, maxYear: 1902 },
      "Issue years 1898 CE to 1902 CE",
    ],
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
