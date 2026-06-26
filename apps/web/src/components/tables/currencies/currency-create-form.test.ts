import { describe, expect, it } from "vitest"

import { isCurrencyCreateReady } from "./currency-create-form"

describe("isCurrencyCreateReady", () => {
  it("requires non-blank Currency Code, Currency Name, and Currency Full Name", () => {
    expect(
      isCurrencyCreateReady({
        code: "united-states-dollar",
        name: "Dollar",
        fullName: " ",
      })
    ).toBe(false)

    expect(
      isCurrencyCreateReady({
        code: " ",
        name: "Dollar",
        fullName: "United States dollar",
      })
    ).toBe(false)
  })

  it("treats identical trimmed Currency Name and Currency Full Name as a complete create draft", () => {
    expect(
      isCurrencyCreateReady({
        code: "euro",
        name: " Euro ",
        fullName: " Euro ",
      })
    ).toBe(true)
  })
})
