import { describe, expect, it } from "vitest"
import {
  coinListInputSchema,
  coinSearchSchema,
  getCoinListLoaderDeps,
  updateCoinSearchFilter,
} from "./coin-search"
import type { CoinListLoaderDeps, CoinSearch } from "./coin-search"

const currentSearch = {
  issuer: "spain",
} satisfies CoinSearch

const baseCoinListLoaderDeps = {
  issuerCode: "spain",
} satisfies CoinListLoaderDeps

function omitFilter<T extends object, TKey extends keyof T>(
  search: T,
  filterName: TKey
): Omit<T, TKey> {
  const { [filterName]: _removedFilter, ...remainingSearch } = search

  return remainingSearch
}

describe("coinSearchSchema", () => {
  it("keeps only issuer and ruler search params", () => {
    expect(
      coinSearchSchema.parse({
        issuer: "spain",
        catalogue: "km",
        composition: "silver-900",
        fromYear: "1900",
      })
    ).toStrictEqual(currentSearch)
  })

  it("normalizes issuer search params", () => {
    expect(
      coinSearchSchema.parse({
        issuer: "  SPAIN  ",
      })
    ).toStrictEqual(currentSearch)
  })

  it("drops blank issuer search params", () => {
    expect(
      coinSearchSchema.parse({
        issuer: "   ",
      })
    ).toStrictEqual({})
  })
})

describe("coinListInputSchema", () => {
  it("keeps only issuer and ruler loader inputs", () => {
    expect(
      coinListInputSchema.parse({
        issuerCode: "spain",
        catalogueCode: "km",
        minValue: 1,
      })
    ).toStrictEqual(baseCoinListLoaderDeps)
  })

  it("normalizes issuer loader inputs", () => {
    expect(
      coinListInputSchema.parse({
        issuerCode: "  SPAIN  ",
      })
    ).toStrictEqual(baseCoinListLoaderDeps)
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
      issuer: "france",
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
      issuerCode: undefined,
    })
  })
})
