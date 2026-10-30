import { describe, expect, it } from "vitest"

import {
  exploreSearchSchema,
  getExploreCoinListFilters,
} from "./explore-search"

describe("Explore search", () => {
  it("keeps valid Explore filters and page while dropping removed filters", () => {
    const search = exploreSearchSchema.parse({
      currency: "euro",
      distribution: "standard-circulation",
      engraver: "first-engraver",
      issuer: "AR",
      mint: "buenos-aires",
      ruler: "roman-republic",
      page: "2",
      year: "1986",
    })

    expect(search).toEqual({
      currency: "euro",
      distribution: "standard-circulation",
      engraver: "first-engraver",
      issuer: "AR",
      mint: "buenos-aires",
      ruler: "roman-republic",
      page: 2,
    })
    expect(getExploreCoinListFilters(search)).toEqual({
      currencySlug: "euro",
      distribution: "standard-circulation",
      engraverSlug: "first-engraver",
      issuerCode: "AR",
      mintSlug: "buenos-aires",
      rulingAuthoritySlug: "roman-republic",
      page: 2,
    })
  })

  it("drops invalid Explore filters and page values", () => {
    expect(
      exploreSearchSchema.parse({
        currency: "EURO",
        distribution: "BAD",
        engraver: "BAD",
        issuer: "bad code",
        mint: "BAD",
        ruler: "BAD",
        page: "0",
      })
    ).toEqual({
      currency: undefined,
      distribution: undefined,
      engraver: undefined,
      issuer: undefined,
      mint: undefined,
      ruler: undefined,
      page: undefined,
    })
    expect(getExploreCoinListFilters({})).toEqual({
      currencySlug: undefined,
      distribution: undefined,
      engraverSlug: undefined,
      issuerCode: undefined,
      mintSlug: undefined,
      rulingAuthoritySlug: undefined,
      page: 1,
    })
  })
})
