import { describe, expect, it } from "vitest"

import { isCurrencyDraftComplete } from "./currency-form.shared"

describe("isCurrencyDraftComplete", () => {
  it("requires non-blank Currency Code, Currency Name, and Currency Full Name", () => {
    expect(
      isCurrencyDraftComplete({
        code: "united-states-dollar",
        name: "Dollar",
        fullName: " ",
      })
    ).toBe(false)

    expect(
      isCurrencyDraftComplete({
        code: " ",
        name: "Dollar",
        fullName: "United States dollar",
      })
    ).toBe(false)
  })

  it("treats identical trimmed Currency Name and Currency Full Name as a complete create draft", () => {
    expect(
      isCurrencyDraftComplete({
        code: "euro",
        name: " Euro ",
        fullName: " Euro ",
      })
    ).toBe(true)
  })
})
