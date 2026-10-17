import { describe, expect, it } from "vitest"

import {
  setExplorePage,
  updateExploreFilters,
} from "./explore-search-navigation"
import type { ExploreSearch } from "./explore-search"

const search: ExploreSearch = {
  distribution: "circulating-commemorative",
  engraver: "first-engraver",
  issuer: "AR",
  page: 3,
  ruler: "selected-authority",
  year: -44,
}

describe("updateExploreFilters", () => {
  it("updates filters while preserving unrelated fields and resetting the page", () => {
    expect(
      updateExploreFilters(search, { distribution: "non-circulating" })
    ).toEqual({
      ...search,
      distribution: "non-circulating",
      page: undefined,
    })
  })

  it("clears a filter with undefined", () => {
    expect(updateExploreFilters(search, { engraver: undefined })).toEqual({
      ...search,
      engraver: undefined,
      page: undefined,
    })
  })
})

describe("setExplorePage", () => {
  it("preserves every filter when changing page", () => {
    expect(setExplorePage(search, 2)).toEqual({ ...search, page: 2 })
  })

  it("canonicalizes page 1 out of the search", () => {
    expect(setExplorePage(search, 1)).toEqual({
      ...search,
      page: undefined,
    })
  })
})
