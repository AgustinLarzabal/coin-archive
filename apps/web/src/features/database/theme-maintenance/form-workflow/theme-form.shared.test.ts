import { describe, expect, it } from "vitest"

import type { Theme } from "@coin-archive/api"

import {
  createThemeDraft,
  isThemeDraftComplete,
  normalizeThemeDraft,
} from "./theme-form.shared"

const theme: Theme = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"theme-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("createThemeDraft", () => {
  it("copies the editable Theme fields from a selected Theme", () => {
    expect(createThemeDraft(theme)).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("normalizeThemeDraft", () => {
  it("trims editable Theme fields", () => {
    expect(
      normalizeThemeDraft({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("isThemeDraftComplete", () => {
  it("requires non-blank Theme Code and Theme Name", () => {
    expect(
      isThemeDraftComplete({
        code: "reeded",
        name: " ",
      })
    ).toBe(false)

    expect(
      isThemeDraftComplete({
        code: " ",
        name: "Reeded",
      })
    ).toBe(false)
  })

  it("treats trimmed Theme Code and Theme Name as a complete create draft", () => {
    expect(
      isThemeDraftComplete({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(true)
  })
})
