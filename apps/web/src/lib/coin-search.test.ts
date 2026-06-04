import { describe, expect, it } from "vitest"

import { updateCoinSearchFilter } from "./coin-search"

describe("updateCoinSearchFilter", () => {
  const currentSearch = {
    issuer: "spain",
    ruler: "felipe-vi",
  }

  it("clears only the selected filter and preserves unrelated search params", () => {
    expect(
      updateCoinSearchFilter(currentSearch, "issuer", undefined)
    ).toStrictEqual({
      ruler: "felipe-vi",
    })
  })

  it.each([undefined, ""])(
    "clears the ruler filter without removing the issuer filter when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "ruler", filterValue)
      ).toStrictEqual({
        issuer: "spain",
      })
    }
  )
})
