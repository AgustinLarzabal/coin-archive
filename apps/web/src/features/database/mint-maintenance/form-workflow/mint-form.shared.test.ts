import { describe, expect, it } from "vitest"

import type { Mint } from "@coin-archive/api"

import {
  createMintDraft,
  isMintDraftComplete,
  normalizeMintDraft,
} from "./mint-form.shared"

const mint: Mint = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"mint-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("createMintDraft", () => {
  it("copies the editable Mint fields from a selected Mint", () => {
    expect(createMintDraft(mint)).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("normalizeMintDraft", () => {
  it("trims editable Mint fields", () => {
    expect(
      normalizeMintDraft({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("isMintDraftComplete", () => {
  it("requires non-blank Mint Code and Mint Name", () => {
    expect(
      isMintDraftComplete({
        code: "reeded",
        name: " ",
      })
    ).toBe(false)

    expect(
      isMintDraftComplete({
        code: " ",
        name: "Reeded",
      })
    ).toBe(false)
  })

  it("treats trimmed Mint Code and Mint Name as a complete create draft", () => {
    expect(
      isMintDraftComplete({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(true)
  })
})
