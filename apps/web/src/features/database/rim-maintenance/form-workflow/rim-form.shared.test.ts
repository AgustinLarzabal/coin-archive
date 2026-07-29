import { describe, expect, it } from "vitest"

import type { RimOption } from "@coin-archive/db"

import {
  createRimDraft,
  isRimDraftComplete,
  normalizeRimDraft,
} from "./rim-form.shared"

const rim: RimOption = {
  id: "dff33645-e973-4fd5-a84d-bf5a773855ef",
  code: "raised",
  name: "Raised rim",
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
}

describe("createRimDraft", () => {
  it("copies the editable Rim fields from a selected Rim", () => {
    expect(createRimDraft(rim)).toStrictEqual({
      code: "raised",
      name: "Raised rim",
    })
  })
})

describe("normalizeRimDraft", () => {
  it("trims editable Rim fields", () => {
    expect(
      normalizeRimDraft({
        code: " raised ",
        name: " Raised rim ",
      })
    ).toStrictEqual({
      code: "raised",
      name: "Raised rim",
    })
  })
})

describe("isRimDraftComplete", () => {
  it("requires non-blank Rim Code and Rim Name", () => {
    expect(
      isRimDraftComplete({
        code: "raised",
        name: " ",
      })
    ).toBe(false)

    expect(
      isRimDraftComplete({
        code: " ",
        name: "Raised rim",
      })
    ).toBe(false)
  })

  it("treats trimmed Rim Code and Rim Name as a complete create draft", () => {
    expect(
      isRimDraftComplete({
        code: " raised ",
        name: " Raised rim ",
      })
    ).toBe(true)
  })
})
