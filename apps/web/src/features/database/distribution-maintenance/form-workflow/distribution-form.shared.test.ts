import { describe, expect, it } from "vitest"

import {
  createDistributionDraft,
  isDistributionDraftComplete,
  normalizeDistributionDraft,
} from "./distribution-form.shared"

const distribution = {
  id: "84863d38-795b-443c-bd27-1dedb73c0fad",
  code: "standard-circulation",
  name: "Standard circulation",
}

describe("createDistributionDraft", () => {
  it("copies the editable Distribution fields from a selected Distribution", () => {
    expect(createDistributionDraft(distribution)).toStrictEqual({
      code: "standard-circulation",
      name: "Standard circulation",
    })
  })
})

describe("normalizeDistributionDraft", () => {
  it("trims editable Distribution fields", () => {
    expect(
      normalizeDistributionDraft({
        code: " standard-circulation ",
        name: " Standard circulation ",
      })
    ).toStrictEqual({
      code: "standard-circulation",
      name: "Standard circulation",
    })
  })
})

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
