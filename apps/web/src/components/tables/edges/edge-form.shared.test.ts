import { describe, expect, it } from "vitest"

import type { EdgeOption } from "@workspace/db"

import {
  createEdgeDraft,
  isEdgeDraftComplete,
  normalizeEdgeDraft,
} from "./edge-form.shared"

const edge: EdgeOption = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  createdAt: new Date("2026-06-24T12:00:00.000Z"),
  updatedAt: new Date("2026-06-24T12:00:00.000Z"),
}

describe("createEdgeDraft", () => {
  it("copies the editable Edge fields from a selected Edge", () => {
    expect(createEdgeDraft(edge)).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("normalizeEdgeDraft", () => {
  it("trims editable Edge fields", () => {
    expect(
      normalizeEdgeDraft({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("isEdgeDraftComplete", () => {
  it("requires non-blank Edge Code and Edge Name", () => {
    expect(
      isEdgeDraftComplete({
        code: "reeded",
        name: " ",
      })
    ).toBe(false)

    expect(
      isEdgeDraftComplete({
        code: " ",
        name: "Reeded",
      })
    ).toBe(false)
  })

  it("treats trimmed Edge Code and Edge Name as a complete create draft", () => {
    expect(
      isEdgeDraftComplete({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(true)
  })
})
