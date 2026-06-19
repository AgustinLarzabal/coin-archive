import { describe, expect, it } from "vitest"
import {
  coinListInputSchema,
  coinSearchSchema,
  getCoinListLoaderDeps,
  hasActiveCoinSearchFilters,
  updateCoinSearchFilter,
} from "./coin-search"
import type { CoinListLoaderDeps, CoinSearch } from "./coin-search"

const currentSearch = {
  engraver: "john-doe",
  issuer: "spain",
  theme: "map",
} satisfies CoinSearch

const baseCoinListLoaderDeps = {
  distributionCode: undefined,
  engraverCode: "john-doe",
  issuerCode: "spain",
  themeCode: "map",
} satisfies CoinListLoaderDeps

function omitFilter<T extends object, TKey extends keyof T>(
  search: T,
  filterName: TKey
): Omit<T, TKey> {
  const { [filterName]: _removedFilter, ...remainingSearch } = search

  return remainingSearch
}

describe("coinSearchSchema", () => {
  it("keeps only supported coin search params", () => {
    expect(
      coinSearchSchema.parse({
        engraver: "john-doe",
        issuer: "spain",
        theme: "map",
        catalogue: "km",
        composition: "silver-900",
        fromYear: "1900",
      })
    ).toStrictEqual(currentSearch)
  })

  it("normalizes supported search params", () => {
    expect(
      coinSearchSchema.parse({
        engraver: "  JOHN-DOE  ",
        issuer: "  SPAIN  ",
        theme: "  MAP  ",
      })
    ).toStrictEqual({
      engraver: "john-doe",
      issuer: "spain",
      theme: "map",
    })
  })

  it("drops blank search params", () => {
    expect(
      coinSearchSchema.parse({
        engraver: "   ",
        issuer: "   ",
        theme: "   ",
      })
    ).toStrictEqual({
      engraver: undefined,
      issuer: undefined,
      theme: undefined,
    })
  })
})

describe("coinListInputSchema", () => {
  it("keeps only supported loader inputs", () => {
    expect(
      coinListInputSchema.parse({
        engraverCode: "john-doe",
        issuerCode: "spain",
        themeCode: "map",
        catalogueCode: "km",
        minValue: 1,
      })
    ).toStrictEqual({
      engraverCode: "john-doe",
      issuerCode: "spain",
      themeCode: "map",
    })
  })

  it("normalizes supported loader inputs", () => {
    expect(
      coinListInputSchema.parse({
        engraverCode: "  JOHN-DOE  ",
        issuerCode: "  SPAIN  ",
        themeCode: "  MAP  ",
      })
    ).toStrictEqual({
      engraverCode: "john-doe",
      issuerCode: "spain",
      themeCode: "map",
    })
  })
})

describe("updateCoinSearchFilter", () => {
  it("clears only the selected filter", () => {
    expect(
      updateCoinSearchFilter(currentSearch, "issuer", undefined)
    ).toStrictEqual(omitFilter(currentSearch, "issuer"))
  })

  it("updates the selected filter", () => {
    expect(
      updateCoinSearchFilter(currentSearch, "issuer", "france")
    ).toStrictEqual({
      engraver: "john-doe",
      issuer: "france",
      theme: "map",
    })
  })
})

describe("getCoinListLoaderDeps", () => {
  it("maps search params to getCoins input", () => {
    expect(getCoinListLoaderDeps(currentSearch)).toStrictEqual(
      baseCoinListLoaderDeps
    )
  })

  it("preserves empty search objects", () => {
    expect(getCoinListLoaderDeps({})).toStrictEqual({
      distributionCode: undefined,
      engraverCode: undefined,
      issuerCode: undefined,
      themeCode: undefined,
    })
  })
})

describe("hasActiveCoinSearchFilters", () => {
  it("returns true when any supported filter is present", () => {
    expect(hasActiveCoinSearchFilters({ engraver: "john-doe" })).toBe(true)
    expect(hasActiveCoinSearchFilters({ issuer: "spain" })).toBe(true)
    expect(hasActiveCoinSearchFilters({ theme: "map" })).toBe(true)
  })

  it("returns false for an empty search object", () => {
    expect(hasActiveCoinSearchFilters({})).toBe(false)
  })
})
