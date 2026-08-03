import type { MintingTechnique } from "@coin-archive/api"

export type MintingTechniqueDraft = {
  code: string
  name: string
}

export const EMPTY_MINTING_TECHNIQUE_DRAFT: MintingTechniqueDraft = {
  code: "",
  name: "",
}

export function createMintingTechniqueDraft(
  mintingTechnique: Pick<MintingTechnique, "code" | "name">
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

export function isMintingTechniqueDraftComplete(draft: MintingTechniqueDraft) {
  const normalizedDraft = normalizeMintingTechniqueDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}

export function hasMintingTechniqueEditChanges(
  mintingTechnique: Pick<MintingTechnique, "code" | "name">,
  draft: MintingTechniqueDraft
) {
  const normalizedCurrent = normalizeMintingTechniqueDraft(
    createMintingTechniqueDraft(mintingTechnique)
  )
  const normalizedDraft = normalizeMintingTechniqueDraft(draft)
  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}
