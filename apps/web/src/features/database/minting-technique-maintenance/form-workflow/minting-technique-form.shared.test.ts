import { describe, expect, it } from "vitest"

import type { MintingTechnique } from "@coin-archive/api"

import {
  createMintingTechniqueDraft,
  isMintingTechniqueDraftComplete,
  normalizeMintingTechniqueDraft,
} from "./minting-technique-form.shared"

const mintingTechnique: MintingTechnique = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"minting-technique-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("createMintingTechniqueDraft", () => {
  it("copies the editable MintingTechnique fields from a selected MintingTechnique", () => {
    expect(createMintingTechniqueDraft(mintingTechnique)).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("normalizeMintingTechniqueDraft", () => {
  it("trims editable MintingTechnique fields", () => {
    expect(
      normalizeMintingTechniqueDraft({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toStrictEqual({
      code: "reeded",
      name: "Reeded",
    })
  })
})

describe("isMintingTechniqueDraftComplete", () => {
  it("requires non-blank Minting Technique Code and Minting Technique Name", () => {
    expect(
      isMintingTechniqueDraftComplete({
        code: "reeded",
        name: " ",
      })
    ).toBe(false)

    expect(
      isMintingTechniqueDraftComplete({
        code: " ",
        name: "Reeded",
      })
    ).toBe(false)
  })

  it("treats trimmed Minting Technique Code and Minting Technique Name as a complete create draft", () => {
    expect(
      isMintingTechniqueDraftComplete({
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(true)
  })
})
