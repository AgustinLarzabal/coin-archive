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

  it.each(["", "ar", "A", "ABC_123", 123])(
    "ignores the malformed Issuer filter %j",
    (issuer) => {
      expect(exploreSearchSchema.parse({ issuer })).toEqual({
        issuer: undefined,
      })
    }
  )

  it("maps URL search state to Coin list filters", () => {
    expect(getExploreCoinListFilters({ issuer: "AR" })).toEqual({
      issuerCode: "AR",
    })
  })
})
