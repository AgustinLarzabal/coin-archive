import { describe, expect, it } from "vitest"

import {
  exploreSearchSchema,
  getExploreCoinListFilters,
} from "./explore-search"

describe("Explore search", () => {
  it("keeps valid Explore filters and page while dropping removed filters", () => {
    const search = exploreSearchSchema.parse({
      amount: "0.5",
      currency: "euro",
      distribution: "standard-circulation",
      composition: "bimetallic",
      engraver: "first-engraver",
      issuer: "AR",
      mint: "buenos-aires",
      ruler: "roman-republic",
      page: "2",
      year: "1986",
      size: "20.25-30",
      thickness: "1.5-2.25",
      weight: "8.125-8.5",
    })

    expect(search).toEqual({
      amount: "0.5",
      currency: "euro",
      distribution: "standard-circulation",
      composition: "bimetallic",
      engraver: "first-engraver",
      issuer: "AR",
      mint: "buenos-aires",
      ruler: "roman-republic",
      year: 1986,
      size: "20.25-30",
      thickness: "1.5-2.25",
      weight: "8.125-8.5",
      page: 2,
    })
    expect(getExploreCoinListFilters(search)).toEqual({
      faceValueAmount: "0.5",
      currencySlug: "euro",
      distribution: "standard-circulation",
      composition: "bimetallic",
      engraverSlug: "first-engraver",
      issuerCode: "AR",
      mintSlug: "buenos-aires",
      rulingAuthoritySlug: "roman-republic",
      issueYear: 1986,
      size: "20.25-30",
      thickness: "1.5-2.25",
      weight: "8.125-8.5",
      page: 2,
    })
  })

  it("drops invalid Explore filters and page values", () => {
    expect(
      exploreSearchSchema.parse({
        amount: "0.50",
        currency: "EURO",
        distribution: "BAD",
        composition: "BAD",
        engraver: "BAD",
        issuer: "bad code",
        mint: "BAD",
        ruler: "BAD",
        year: "0",
        size: "0-20.001",
        thickness: "2.25-1.5",
        weight: "8.1234",
        page: "0",
      })
    ).toEqual({
      amount: undefined,
      currency: undefined,
      distribution: undefined,
      composition: undefined,
      engraver: undefined,
      issuer: undefined,
      mint: undefined,
      ruler: undefined,
      year: undefined,
      size: undefined,
      thickness: undefined,
      weight: undefined,
      page: undefined,
    })
    expect(getExploreCoinListFilters({})).toEqual({
      faceValueAmount: undefined,
      currencySlug: undefined,
      distribution: undefined,
      composition: undefined,
      engraverSlug: undefined,
      issuerCode: undefined,
      mintSlug: undefined,
      rulingAuthoritySlug: undefined,
      issueYear: undefined,
      size: undefined,
      thickness: undefined,
      weight: undefined,
      page: 1,
    })
    expect(
      exploreSearchSchema.parse({ year: "1990-1986" }).year
    ).toBeUndefined()
    expect(exploreSearchSchema.parse({ year: "-25-19" }).year).toBe("-25-19")
    expect(exploreSearchSchema.parse({ size: "25.75" }).size).toBe("25.75")
    expect(exploreSearchSchema.parse({ thickness: "2.2" }).thickness).toBe(
      "2.2"
    )
    expect(exploreSearchSchema.parse({ weight: "8.125" }).weight).toBe("8.125")
    expect(
      getExploreCoinListFilters(exploreSearchSchema.parse({ amount: "0.5" }))
        .faceValueAmount
    ).toBeUndefined()
  })
})
