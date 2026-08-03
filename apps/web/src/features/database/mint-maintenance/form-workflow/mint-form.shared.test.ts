import { describe, expect, it } from "vitest"

import type { Mint } from "@coin-archive/api"

import {
  createMintDraft,
  isMintDraftComplete,
  normalizeMintDraft,
} from "./mint-form.shared"

const mint: Mint = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "madrid",
  name: "Madrid",
  version: 1,
  etag: '"mint-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("createMintDraft", () => {
  it("copies the editable Mint fields from a selected Mint", () => {
    expect(createMintDraft(mint)).toStrictEqual({
      code: "madrid",
      name: "Madrid",
    })
  })
})

describe("normalizeMintDraft", () => {
  it("trims editable Mint fields", () => {
    expect(
      normalizeMintDraft({
        code: " madrid ",
        name: " Madrid ",
      })
    ).toStrictEqual({
      code: "madrid",
      name: "Madrid",
    })
  })
})

describe("isMintDraftComplete", () => {
  it("requires non-blank Mint Code and Mint Name", () => {
    expect(
      isMintDraftComplete({
        code: "madrid",
        name: " ",
      })
    ).toBe(false)

    expect(
      isMintDraftComplete({
        code: " ",
        name: "Madrid",
      })
    ).toBe(false)
  })

  it("treats trimmed Mint Code and Mint Name as a complete create draft", () => {
    expect(
      isMintDraftComplete({
        code: " madrid ",
        name: " Madrid ",
      })
    ).toBe(true)
  })
})
