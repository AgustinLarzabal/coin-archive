import type { TechniqueOption } from "@coin-archive/db"
import { describe, expect, it } from "vitest"

import {
  createMintingTechniqueDraft,
  isMintingTechniqueDraftComplete,
  normalizeMintingTechniqueDraft,
} from "./minting-technique-form.shared"

const mintingTechnique: TechniqueOption = {
  id: "8bfd8928-cd58-4a23-b13c-969be89f4d88",
  code: "hammered",
  name: "Hammered",
  createdAt: new Date("2026-07-02T00:00:00.000Z"),
  updatedAt: new Date("2026-07-02T00:00:00.000Z"),
}

describe("createMintingTechniqueDraft", () => {
  it("copies the editable Minting Technique fields from a selected Minting Technique", () => {
    expect(createMintingTechniqueDraft(mintingTechnique)).toStrictEqual({
      code: "hammered",
      name: "Hammered",
    })
  })
})

describe("normalizeMintingTechniqueDraft", () => {
  it("trims editable Minting Technique fields", () => {
    expect(
      normalizeMintingTechniqueDraft({
        code: " hammered ",
        name: " Hammered ",
      })
    ).toStrictEqual({
      code: "hammered",
      name: "Hammered",
    })
  })
})

describe("isMintingTechniqueDraftComplete", () => {
  it("requires non-blank Minting Technique Code and Minting Technique Name", () => {
    expect(
      isMintingTechniqueDraftComplete({
        code: "hammered",
        name: " ",
      })
    ).toBe(false)

    expect(
      isMintingTechniqueDraftComplete({
        code: " ",
        name: "Hammered",
      })
    ).toBe(false)
  })

  it("treats trimmed Minting Technique Code and Minting Technique Name as a complete create draft", () => {
    expect(
      isMintingTechniqueDraftComplete({
        code: " hammered ",
        name: " Hammered ",
      })
    ).toBe(true)
  })
})
