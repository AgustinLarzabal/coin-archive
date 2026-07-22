import { describe, expect, it } from "vitest"

import { isEngraverDraftComplete } from "./engraver-form.shared"

describe("isEngraverDraftComplete", () => {
  it("requires non-blank Engraver Code and Engraver Name", () => {
    expect(
      isEngraverDraftComplete({
        code: "barth",
        name: " ",
      })
    ).toBe(false)

    expect(
      isEngraverDraftComplete({
        code: " ",
        name: "Barth",
      })
    ).toBe(false)
  })

  it("treats trimmed Engraver Code and Engraver Name as a complete create draft", () => {
    expect(
      isEngraverDraftComplete({
        code: " barth ",
        name: " Barth ",
      })
    ).toBe(true)
  })
})
