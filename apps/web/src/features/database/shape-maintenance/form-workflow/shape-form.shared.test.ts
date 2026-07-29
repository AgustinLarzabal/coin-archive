import { describe, expect, it } from "vitest"

import type { ShapeOption } from "@coin-archive/db"

import {
  createShapeDraft,
  isShapeDraftComplete,
  normalizeShapeDraft,
} from "./shape-form.shared"

const shape: ShapeOption = {
  id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
  code: "round",
  name: "Round",
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
}

describe("createShapeDraft", () => {
  it("copies the editable Shape fields from a selected Shape", () => {
    expect(createShapeDraft(shape)).toStrictEqual({
      code: "round",
      name: "Round",
    })
  })
})

describe("normalizeShapeDraft", () => {
  it("trims editable Shape fields", () => {
    expect(
      normalizeShapeDraft({
        code: " round ",
        name: " Round ",
      })
    ).toStrictEqual({
      code: "round",
      name: "Round",
    })
  })
})

describe("isShapeDraftComplete", () => {
  it("requires non-blank Shape Code and Shape Name", () => {
    expect(
      isShapeDraftComplete({
        code: "round",
        name: " ",
      })
    ).toBe(false)

    expect(
      isShapeDraftComplete({
        code: " ",
        name: "Round",
      })
    ).toBe(false)
  })

  it("treats trimmed Shape Code and Shape Name as a complete create draft", () => {
    expect(
      isShapeDraftComplete({
        code: " round ",
        name: " Round ",
      })
    ).toBe(true)
  })
})
