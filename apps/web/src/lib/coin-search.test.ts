import { describe, expect, it } from "vitest"

import {
  applyIssueYearRangeSearch,
  applyMeasurementRangeSearch,
  coinSearchSchema,
  findSelectedCatalogueOption,
  findSelectedCompositionOption,
  findSelectedDistributionOption,
  formatIssueYearRangeLabel,
  formatMeasurementLabel,
  getCatalogueOptionLabel,
  getCompositionOptionLabel,
  getDistributionOptionLabel,
  getCoinListLoaderDeps,
  updateCoinSearchFilter,
} from "./coin-search"

const currentSearch = {
  catalogue: "km",
  composition: "silver-900",
  distribution: "circulating-commemorative",
  fromYear: 1898,
  issuer: "spain",
  maxDiameter: 30.5,
  maxThickness: 2.5,
  maxWeight: 8.75,
  minDiameter: 20.25,
  minThickness: 1.25,
  minWeight: 4.5,
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
      composition: "silver-900",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
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
        composition: "silver-900",
        fromYear: 1898,
        issuer: "spain",
        maxDiameter: 30.5,
        maxThickness: 2.5,
        maxWeight: 8.75,
        minDiameter: 20.25,
        minThickness: 1.25,
        minWeight: 4.5,
        referenceNumber: "1338",
        ruler: "felipe-vi",
        toYear: 1902,
      })
    }
  )

  it.each([undefined, ""])(
    "clears the composition filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "composition", filterValue)
      ).toStrictEqual({
        catalogue: "km",
        distribution: "circulating-commemorative",
        fromYear: 1898,
        issuer: "spain",
        maxDiameter: 30.5,
        maxThickness: 2.5,
        maxWeight: 8.75,
        minDiameter: 20.25,
        minThickness: 1.25,
        minWeight: 4.5,
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
        composition: "silver-900",
        distribution: "circulating-commemorative",
        fromYear: 1898,
        issuer: "spain",
        maxDiameter: 30.5,
        maxThickness: 2.5,
        maxWeight: 8.75,
        minDiameter: 20.25,
        minThickness: 1.25,
        minWeight: 4.5,
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
        composition: "silver-900",
        distribution: "circulating-commemorative",
        fromYear: 1898,
        issuer: "spain",
        maxDiameter: 30.5,
        maxThickness: 2.5,
        maxWeight: 8.75,
        minDiameter: 20.25,
        minThickness: 1.25,
        minWeight: 4.5,
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
        composition: "silver-900",
        distribution: "circulating-commemorative",
        issuer: "spain",
        maxDiameter: 30.5,
        maxThickness: 2.5,
        maxWeight: 8.75,
        minDiameter: 20.25,
        minThickness: 1.25,
        minWeight: 4.5,
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
        composition: "silver-900",
        distribution: "circulating-commemorative",
        fromYear: 1898,
        issuer: "spain",
        maxDiameter: 30.5,
        maxThickness: 2.5,
        maxWeight: 8.75,
        minDiameter: 20.25,
        minThickness: 1.25,
        minWeight: 4.5,
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
      composition: "silver-900",
      distribution: "circulating-commemorative",
      fromYear: -43,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
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
      distribution: "circulating-commemorative",
      fromYear: 1900,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
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
      distribution: "circulating-commemorative",
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
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
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
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
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1900,
    })
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
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.25,
      maxThickness: 2.75,
      minDiameter: 18.5,
      minWeight: 5.25,
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
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxThickness: 2.5,
      maxWeight: 8.75,
      minDiameter: 20.25,
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
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.75,
      maxThickness: 2.25,
      maxWeight: 9.5,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      referenceNumber: "1338",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })
})

describe("coinSearchSchema", () => {
  it("accepts homepage catalogue, issue year range, measurement, and reference number search params", () => {
    expect(
      coinSearchSchema.parse({
        catalogue: "km",
        composition: "silver-900",
        distribution: "circulating-commemorative",
        fromYear: "1898",
        issuer: "spain",
        maxDiameter: "30.5",
        maxThickness: "2.5",
        maxWeight: "8.75",
        minDiameter: "20.25",
        minThickness: "1.25",
        minWeight: "4.5",
        referenceNumber: "1338A",
        ruler: "felipe-vi",
        toYear: "1902",
      })
    ).toStrictEqual({
      catalogue: "km",
      composition: "silver-900",
      distribution: "circulating-commemorative",
      fromYear: 1898,
      issuer: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
      referenceNumber: "1338A",
      ruler: "felipe-vi",
      toYear: 1902,
    })
  })

  it("treats blank issue year and measurement params as undefined", () => {
    expect(
      coinSearchSchema.parse({
        fromYear: "",
        maxDiameter: "  ",
        minWeight: "",
        toYear: "  ",
      })
    ).toStrictEqual({
      fromYear: undefined,
      maxDiameter: undefined,
      minWeight: undefined,
      toYear: undefined,
    })
  })
})

describe("getCoinListLoaderDeps", () => {
  it("passes homepage issue year, measurement, distribution, catalogue, reference number, issuer, and ruler filters to the coin listing boundary", () => {
    expect(getCoinListLoaderDeps(currentSearch)).toStrictEqual({
      catalogueCode: "km",
      compositionCode: "silver-900",
      distributionCode: "circulating-commemorative",
      fromYear: 1898,
      issuerCode: "spain",
      maxDiameter: 30.5,
      maxThickness: 2.5,
      maxWeight: 8.75,
      minDiameter: 20.25,
      minThickness: 1.25,
      minWeight: 4.5,
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
