import { describe, expect, it } from "vitest"

import type { Shape } from "@coin-archive/api"

import {
  createShapeDraft,
  isShapeDraftComplete,
  normalizeShapeDraft,
} from "./shape-form.shared"

const shape: Shape = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"shape-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("createShapeDraft", () => {
  it("copies the editable Shape fields from a selected Shape", () => {
    expect(createShapeDraft(shape)).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("normalizeShapeDraft", () => {
  it("trims editable Shape fields", () => {
    expect(
      normalizeShapeDraft({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("isShapeDraftComplete", () => {
  it("requires non-blank Shape Code and Shape Name", () => {
    expect(
      isShapeDraftComplete({
        code: "reeded",
        name: " ",
      })
    ).toBe(false)

    expect(
      isShapeDraftComplete({
        code: " ",
        name: "Reeded",
      })
    ).toBe(false)
  })

  it("treats trimmed Shape Code and Shape Name as a complete create draft", () => {
    expect(
      isShapeDraftComplete({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(true)
  })
})
