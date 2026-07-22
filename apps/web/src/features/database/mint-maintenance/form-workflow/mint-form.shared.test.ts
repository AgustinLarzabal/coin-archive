import { describe, expect, it } from "vitest"

import { isMintDraftComplete } from "./mint-form.shared"

describe("isMintDraftComplete", () => {
  it("requires non-blank Mint Code and Mint Name", () => {
    expect(
      isMintDraftComplete({
        code: "buenos-aires-mint",
        name: " ",
      })
    ).toBe(false)

    expect(
      isMintDraftComplete({
        code: " ",
        name: "Buenos Aires Mint",
      })
    ).toBe(false)
  })

  it("treats trimmed Mint Code and Mint Name as a complete create draft", () => {
    expect(
      isMintDraftComplete({
        code: " buenos-aires-mint ",
        name: " Buenos Aires Mint ",
      })
    ).toBe(true)
  })
})
