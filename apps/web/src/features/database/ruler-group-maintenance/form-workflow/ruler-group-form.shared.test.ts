import { describe, expect, it } from "vitest"

import type { RulerGroup } from "@coin-archive/api"

import {
  createRulerGroupDraft,
  isRulerGroupDraftComplete,
  normalizeRulerGroupDraft,
} from "./ruler-group-form.shared"

const rulerGroup: RulerGroup = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"ruler-group-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("createRulerGroupDraft", () => {
  it("copies the editable RulerGroup fields from a selected RulerGroup", () => {
    expect(createRulerGroupDraft(rulerGroup)).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("normalizeRulerGroupDraft", () => {
  it("trims editable RulerGroup fields", () => {
    expect(
      normalizeRulerGroupDraft({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("isRulerGroupDraftComplete", () => {
  it("requires non-blank Ruler Group Code and Ruler Group Name", () => {
    expect(
      isRulerGroupDraftComplete({
        code: "reeded",
        name: " ",
      })
    ).toBe(false)

    expect(
      isRulerGroupDraftComplete({
        code: " ",
        name: "Reeded",
      })
    ).toBe(false)
  })

  it("treats trimmed Ruler Group Code and Ruler Group Name as a complete create draft", () => {
    expect(
      isRulerGroupDraftComplete({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(true)
  })
})
