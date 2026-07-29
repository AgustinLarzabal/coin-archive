import { describe, expect, it } from "vitest"

import type { OrientationOption } from "@coin-archive/db"

import {
  createOrientationDraft,
  isOrientationDraftComplete,
  normalizeOrientationDraft,
} from "./orientation-form.shared"

const orientation: OrientationOption = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  createdAt: new Date("2026-06-24T12:00:00.000Z"),
  updatedAt: new Date("2026-06-24T12:00:00.000Z"),
}

describe("createOrientationDraft", () => {
  it("copies the editable Orientation fields from a selected Orientation", () => {
    expect(createOrientationDraft(orientation)).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("normalizeOrientationDraft", () => {
  it("trims editable Orientation fields", () => {
    expect(
      normalizeOrientationDraft({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("isOrientationDraftComplete", () => {
  it("requires non-blank Orientation Code and Orientation Name", () => {
    expect(
      isOrientationDraftComplete({
        code: "reeded",
        name: " ",
      })
    ).toBe(false)

    expect(
      isOrientationDraftComplete({
        code: " ",
        name: "Reeded",
      })
    ).toBe(false)
  })

  it("treats trimmed Orientation Code and Orientation Name as a complete create draft", () => {
    expect(
      isOrientationDraftComplete({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(true)
  })
})
