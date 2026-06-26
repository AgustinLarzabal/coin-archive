import { describe, expect, it } from "vitest"

import { isDistributionDraftComplete } from "./distribution-form.shared"

describe("isDistributionDraftComplete", () => {
  it("requires non-blank Distribution Code and Distribution Name", () => {
    expect(
      isDistributionDraftComplete({
        code: "standard-circulation",
        name: " ",
      })
    ).toBe(false)

    expect(
      isDistributionDraftComplete({
        code: " ",
        name: "Standard circulation",
      })
    ).toBe(false)
  })

  it("treats trimmed Distribution Code and Distribution Name as a complete create draft", () => {
    expect(
      isDistributionDraftComplete({
        code: " standard-circulation ",
        name: " Standard circulation ",
      })
    ).toBe(true)
  })
})
