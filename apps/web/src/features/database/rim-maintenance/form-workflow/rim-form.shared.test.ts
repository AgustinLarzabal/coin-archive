import { describe, expect, it } from "vitest"

import type { Rim } from "@coin-archive/api"

import {
  createRimDraft,
  isRimDraftComplete,
  normalizeRimDraft,
} from "./rim-form.shared"

const rim: Rim = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"rim-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("createRimDraft", () => {
  it("copies the editable Rim fields from a selected Rim", () => {
    expect(createRimDraft(rim)).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("normalizeRimDraft", () => {
  it("trims editable Rim fields", () => {
    expect(
      normalizeRimDraft({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("isRimDraftComplete", () => {
  it("requires non-blank Rim Code and Rim Name", () => {
    expect(
      isRimDraftComplete({
        code: "reeded",
        name: " ",
      })
    ).toBe(false)

    expect(
      isRimDraftComplete({
        code: " ",
        name: "Reeded",
      })
    ).toBe(false)
  })

  it("treats trimmed Rim Code and Rim Name as a complete create draft", () => {
    expect(
      isRimDraftComplete({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(true)
  })
})
