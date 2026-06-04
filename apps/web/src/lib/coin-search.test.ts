import { describe, expect, it } from "vitest"

import { updateCoinSearchFilter } from "./coin-search"

describe("updateCoinSearchFilter", () => {
  const currentSearch = {
    catalogue: "km",
    issuer: "spain",
    referenceNumber: "1338",
    ruler: "felipe-vi",
  }

  it("clears only the selected filter and preserves unrelated search params", () => {
    expect(
      updateCoinSearchFilter(currentSearch, "issuer", undefined)
    ).toStrictEqual({
      catalogue: "km",
      referenceNumber: "1338",
      ruler: "felipe-vi",
    })
  })

  it.each([undefined, ""])(
    "clears the ruler filter without removing the issuer filter when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "ruler", filterValue)
      ).toStrictEqual({
        catalogue: "km",
        issuer: "spain",
        referenceNumber: "1338",
      })
    }
  )

  it.each([undefined, ""])(
    "clears the reference number filter without removing the other filters when the value is %p",
    (filterValue) => {
      expect(
        updateCoinSearchFilter(currentSearch, "referenceNumber", filterValue)
      ).toStrictEqual({
        catalogue: "km",
        issuer: "spain",
        ruler: "felipe-vi",
      })
    }
  )
})
