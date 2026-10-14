import { describe, expect, it } from "vitest"

import {
  exploreSearchSchema,
  getExploreCoinListFilters,
} from "./explore-search"

describe("Explore search schema", () => {
  it("accepts a valid Issuer Code", () => {
    expect(exploreSearchSchema.parse({ issuer: "ROMAN" })).toEqual({
      issuer: "ROMAN",
    })
  })

  it("allows the Issuer filter to be omitted", () => {
    expect(exploreSearchSchema.parse({})).toEqual({})
  })

  it("accepts a valid Engraver Slug", () => {
    expect(exploreSearchSchema.parse({ engraver: "first-engraver" })).toEqual({
      engraver: "first-engraver",
    })
  })

  it.each(["", "ar", "A", "ABC_123", 123])(
    "ignores the malformed Issuer filter %j",
    (issuer) => {
      expect(exploreSearchSchema.parse({ issuer })).toEqual({
        issuer: undefined,
      })
    }
  )

  it.each(["", "First-Engraver", "ab", "first--engraver", 123])(
    "ignores the malformed Engraver filter %j",
    (engraver) => {
      expect(exploreSearchSchema.parse({ issuer: "AR", engraver })).toEqual({
        issuer: "AR",
        engraver: undefined,
      })
    }
  )

  it("maps URL search state to Coin list filters", () => {
    expect(
      getExploreCoinListFilters({
        issuer: "AR",
        engraver: "first-engraver",
      })
    ).toEqual({
      issuerCode: "AR",
      engraverSlug: "first-engraver",
      page: 1,
    })
  })

  it("maps a one-based URL page to the Coin list request", () => {
    const search = exploreSearchSchema.parse({ page: "3" })

    expect(search).toEqual({ page: 3 })
    expect(getExploreCoinListFilters(search)).toEqual({
      engraverSlug: undefined,
      issuerCode: undefined,
      page: 3,
    })
  })

  it.each(["0", "1.5", "0x10", "1e2", " 1 "])(
    "ignores the malformed page %j",
    (page) => {
      expect(exploreSearchSchema.parse({ page })).toEqual({ page: undefined })
    }
  )
})
