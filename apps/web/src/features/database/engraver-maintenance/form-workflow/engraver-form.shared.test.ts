import { describe, expect, it } from "vitest"

import type { Engraver } from "@coin-archive/api"

import {
  createEngraverDraft,
  isEngraverDraftComplete,
  normalizeEngraverDraft,
} from "./engraver-form.shared"

const engraver: Engraver = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"engraver-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("createEngraverDraft", () => {
  it("copies the editable Engraver fields from a selected Engraver", () => {
    expect(createEngraverDraft(engraver)).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("normalizeEngraverDraft", () => {
  it("trims editable Engraver fields", () => {
    expect(
      normalizeEngraverDraft({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("isEngraverDraftComplete", () => {
  it("requires non-blank Engraver Code and Engraver Name", () => {
    expect(
      isEngraverDraftComplete({
        code: "reeded",
        name: " ",
      })
    ).toBe(false)

    expect(
      isEngraverDraftComplete({
        code: " ",
        name: "Reeded",
      })
    ).toBe(false)
  })

  it("treats trimmed Engraver Code and Engraver Name as a complete create draft", () => {
    expect(
      isEngraverDraftComplete({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(true)
  })
})
