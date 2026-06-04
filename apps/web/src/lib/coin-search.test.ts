import { describe, expect, it } from "vitest"

import {
  coinSearchSchema,
  findSelectedCatalogueOption,
  getCatalogueOptionLabel,
  getCoinListLoaderDeps,
  updateCoinSearchFilter,
} from "./coin-search"

describe("updateCoinSearchFilter", () => {
  const currentSearch = {
    catalogue: "km",
    issuer: "spain",
    referenceNumber: "1338",
    ruler: "felipe-vi",
  }

  it("clears only the selected filter and preserves unrelated search params", () => {
    expect(
      updateCoinSearchFilter(currentSearch, "issuer", undefined)
    ).toStrictEqual({
      catalogue: "km",
      referenceNumber: "1338",
      ruler: "felipe-vi",
    })
  })

  it.each([undefined, ""])(
    "clears the ruler filter without removing the issuer filter when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "ruler", filterValue)
      ).toStrictEqual({
        catalogue: "km",
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
        issuer: "spain",
        referenceNumber: "1338A",
        ruler: "felipe-vi",
      })
    ).toStrictEqual({
      catalogue: "km",
      issuer: "spain",
      referenceNumber: "1338A",
      ruler: "felipe-vi",
    })
  })
})

describe("getCoinListLoaderDeps", () => {
  it("passes homepage catalogue, reference number, issuer, and ruler filters to the coin listing boundary", () => {
    expect(
      getCoinListLoaderDeps({
        catalogue: "km",
        issuer: "spain",
        referenceNumber: "1338",
        ruler: "felipe-vi",
      })
    ).toStrictEqual({
      catalogueCode: "km",
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
