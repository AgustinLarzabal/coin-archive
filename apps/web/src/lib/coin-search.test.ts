import { describe, expect, it } from "vitest"

import {
  coinSearchSchema,
  findSelectedCatalogueOption,
  findSelectedDistributionOption,
  getCatalogueOptionLabel,
  getDistributionOptionLabel,
  getCoinListLoaderDeps,
  updateCoinSearchFilter,
} from "./coin-search"

describe("updateCoinSearchFilter", () => {
  const currentSearch = {
    catalogue: "km",
    distribution: "circulating-commemorative",
    issuer: "spain",
    referenceNumber: "1338",
    ruler: "felipe-vi",
  }

  it("clears only the selected filter and preserves unrelated search params", () => {
    expect(
      updateCoinSearchFilter(currentSearch, "issuer", undefined)
    ).toStrictEqual({
      catalogue: "km",
      distribution: "circulating-commemorative",
      referenceNumber: "1338",
      ruler: "felipe-vi",
    })
  })

  it.each([undefined, ""])(
    "clears the distribution filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "distribution", filterValue)
      ).toStrictEqual({
        catalogue: "km",
        issuer: "spain",
        referenceNumber: "1338",
        ruler: "felipe-vi",
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
        issuer: "spain",
        referenceNumber: "1338",
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
        issuer: "spain",
        ruler: "felipe-vi",
      })
    }
  )
})

describe("coinSearchSchema", () => {
  it("accepts homepage catalogue and reference number search params", () => {
    expect(
      coinSearchSchema.parse({
        catalogue: "km",
        distribution: "circulating-commemorative",
        issuer: "spain",
        referenceNumber: "1338A",
        ruler: "felipe-vi",
      })
    ).toStrictEqual({
      catalogue: "km",
      distribution: "circulating-commemorative",
      issuer: "spain",
      referenceNumber: "1338A",
      ruler: "felipe-vi",
    })
  })
})

describe("getCoinListLoaderDeps", () => {
  it("passes homepage distribution, catalogue, reference number, issuer, and ruler filters to the coin listing boundary", () => {
    expect(
      getCoinListLoaderDeps({
        catalogue: "km",
        distribution: "circulating-commemorative",
        issuer: "spain",
        referenceNumber: "1338",
        ruler: "felipe-vi",
      })
    ).toStrictEqual({
      catalogueCode: "km",
      distributionCode: "circulating-commemorative",
      issuerCode: "spain",
      referenceNumber: "1338",
      rulerCode: "felipe-vi",
    })
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
