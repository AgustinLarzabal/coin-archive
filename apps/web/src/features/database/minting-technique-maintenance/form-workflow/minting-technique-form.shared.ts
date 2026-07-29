import type { TechniqueOption } from "@coin-archive/db"

export type MintingTechniqueDraft = {
  code: string
  name: string
}

export const EMPTY_MINTING_TECHNIQUE_DRAFT: MintingTechniqueDraft = {
  code: "",
  name: "",
}

export function createMintingTechniqueDraft(
  mintingTechnique: TechniqueOption
): MintingTechniqueDraft {
  return {
    code: mintingTechnique.code,
    name: mintingTechnique.name,
  }
}

export function normalizeMintingTechniqueDraft(
  draft: MintingTechniqueDraft
): MintingTechniqueDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function isMintingTechniqueDraftComplete(
  draft: MintingTechniqueDraft
) {
  const normalizedDraft = normalizeMintingTechniqueDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}
