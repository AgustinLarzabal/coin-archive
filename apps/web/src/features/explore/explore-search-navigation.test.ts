import { describe, expect, it } from "vitest"

import {
  setExplorePage,
  updateExploreFilters,
} from "./explore-search-navigation"

describe("Explore navigation", () => {
  it("changes or clears Issuer and resets pagination", () => {
    expect(
      updateExploreFilters({ issuer: "AR", page: 3 }, { issuer: "ROMAN" })
    ).toEqual({
      issuer: "ROMAN",
      page: undefined,
    })
    expect(
      updateExploreFilters({ issuer: "AR", page: 3 }, { issuer: undefined })
    ).toEqual({
      issuer: undefined,
      page: undefined,
    })
  })

  it("changes pages while keeping Issuer", () => {
    expect(setExplorePage({ issuer: "AR" }, 2)).toEqual({
      issuer: "AR",
      page: 2,
    })
    expect(setExplorePage({ issuer: "AR", page: 2 }, 1)).toEqual({
      issuer: "AR",
      page: undefined,
    })
  })

  it("keeps Distribution when changing Issuer and resets pagination", () => {
    expect(
      updateExploreFilters(
        { distribution: "standard-circulation", issuer: "AR", page: 3 },
        { issuer: "ROMAN" }
      )
    ).toEqual({
      distribution: "standard-circulation",
      issuer: "ROMAN",
      page: undefined,
    })
  })
})
