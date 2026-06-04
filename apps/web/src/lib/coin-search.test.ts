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
})
