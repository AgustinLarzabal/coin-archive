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

  it("accepts one exact Ruling Authority Slug", () => {
    expect(exploreSearchSchema.parse({ ruler: "first-authority" })).toEqual({
      ruler: "first-authority",
    })
  })

  it.each(["", "First-Authority", "ab", "first--authority", 123])(
    "ignores the malformed Ruling Authority filter %j",
    (ruler) => {
      expect(exploreSearchSchema.parse({ issuer: "AR", ruler })).toEqual({
        issuer: "AR",
        ruler: undefined,
      })
    }
  )

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
        ruler: "first-authority",
      })
    ).toEqual({
      issuerCode: "AR",
      engraverSlug: "first-engraver",
      rulingAuthoritySlug: "first-authority",
      page: 1,
    })
  })

  it("maps one canonical CE Issue Year to the Coin list request", () => {
    const search = exploreSearchSchema.parse({ year: "1986" })

    expect(search).toEqual({ year: 1986 })
    expect(getExploreCoinListFilters(search)).toEqual({
      engraverSlug: undefined,
      issuerCode: undefined,
      issueYear: 1986,
      page: 1,
    })
  })

  it("maps one canonical BCE Issue Year to the Coin list request", () => {
    const search = exploreSearchSchema.parse({ year: "-44" })

    expect(search).toEqual({ year: -44 })
    expect(getExploreCoinListFilters(search)).toEqual({
      engraverSlug: undefined,
      issuerCode: undefined,
      issueYear: -44,
      page: 1,
    })
  })

  it("maps one canonical CE range to the Coin list request", () => {
    const search = exploreSearchSchema.parse({ year: "1986-1990" })

    expect(search).toEqual({ year: "1986-1990" })
    expect(getExploreCoinListFilters(search)).toEqual({
      engraverSlug: undefined,
      issuerCode: undefined,
      issueYear: "1986-1990",
      page: 1,
    })
  })

  it.each(["-400--300", "-25-19"])(
    "maps the canonical signed range %s to the Coin list request",
    (year) => {
      const search = exploreSearchSchema.parse({ year })

      expect(search).toEqual({ year })
      expect(getExploreCoinListFilters(search)).toEqual({
        engraverSlug: undefined,
        issuerCode: undefined,
        issueYear: year,
        page: 1,
      })
    }
  )

  it.each([
    "",
    "0",
    "-0",
    "+44",
    "-044",
    "--44",
    "1986-",
    "1990-1986",
    "0-1988",
    "1986-0",
    "-300--400",
    "25--19",
    "1986–1988",
    "1986,1988",
    "1.5",
    " 1986 ",
  ])("ignores the malformed Issue Year %j", (year) => {
    expect(exploreSearchSchema.parse({ issuer: "AR", year })).toEqual({
      issuer: "AR",
      year: undefined,
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
