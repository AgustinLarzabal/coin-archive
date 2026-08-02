import { describe, expect, it } from "vitest"

import type { Edge } from "@coin-archive/api"

import {
  createEdgeDraft,
  isEdgeDraftComplete,
  normalizeEdgeDraft,
} from "./edge-form.shared"

const edge: Edge = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"edge-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
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
