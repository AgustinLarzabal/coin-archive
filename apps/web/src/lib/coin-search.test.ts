import { describe, expect, it } from "vitest"

import { updateCoinSearchFilter } from "./coin-search"

describe("updateCoinSearchFilter", () => {
  it("clears only the selected filter and preserves unrelated search params", () => {
    expect(
      updateCoinSearchFilter(
        {
          issuer: "spain",
          ruler: "felipe-vi",
        },
        "issuer",
        undefined
      )
    ).toStrictEqual({
      ruler: "felipe-vi",
    })
  })

  it("clears the ruler filter without removing the issuer filter", () => {
    expect(
      updateCoinSearchFilter(
        {
          issuer: "spain",
          ruler: "felipe-vi",
        },
        "ruler",
        undefined
      )
    ).toStrictEqual({
      issuer: "spain",
    })
  })

  it("treats an empty filter value as clearing that filter", () => {
    expect(
      updateCoinSearchFilter(
        {
          issuer: "spain",
          ruler: "felipe-vi",
        },
        "ruler",
        ""
      )
    ).toStrictEqual({
      issuer: "spain",
    })
  })
})
