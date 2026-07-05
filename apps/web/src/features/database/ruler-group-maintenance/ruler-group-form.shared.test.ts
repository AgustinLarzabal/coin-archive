import { describe, expect, it } from "vitest"

import type { RulerGroupOption } from "@workspace/db"

import {
  createRulerGroupDraft,
  isRulerGroupDraftComplete,
  normalizeRulerGroupDraft,
} from "./ruler-group-form.shared"

const rulerGroup: RulerGroupOption = {
  id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
  code: "house-of-bourbon",
  name: "House of Bourbon",
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
}

describe("createRulerGroupDraft", () => {
  it("copies the editable Ruler Group fields from a selected Ruler Group", () => {
    expect(createRulerGroupDraft(rulerGroup)).toStrictEqual({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
  })
})

describe("normalizeRulerGroupDraft", () => {
  it("trims editable Ruler Group fields", () => {
    expect(
      normalizeRulerGroupDraft({
        code: " house-of-bourbon ",
        name: " House of Bourbon ",
      })
    ).toStrictEqual({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
  })
})

describe("isRulerGroupDraftComplete", () => {
  it("requires non-blank Ruler Group Code and Ruler Group Name", () => {
    expect(
      isRulerGroupDraftComplete({
        code: "house-of-bourbon",
        name: " ",
      })
    ).toBe(false)

    expect(
      isRulerGroupDraftComplete({
        code: " ",
        name: "House of Bourbon",
      })
    ).toBe(false)
  })

  it("treats trimmed Ruler Group Code and Ruler Group Name as a complete create draft", () => {
    expect(
      isRulerGroupDraftComplete({
        code: " house-of-bourbon ",
        name: " House of Bourbon ",
      })
    ).toBe(true)
  })
})
