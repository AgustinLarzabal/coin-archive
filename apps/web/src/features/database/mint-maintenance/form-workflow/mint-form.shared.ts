import type { Mint } from "@coin-archive/api"

export type MintDraft = {
  code: string
  name: string
}

export const EMPTY_MINT_DRAFT: MintDraft = {
  code: "",
  name: "",
}

export function createMintDraft(mint: Pick<Mint, "code" | "name">): MintDraft {
  return {
    code: mint.code,
    name: mint.name,
  }
}

export function normalizeMintDraft(draft: MintDraft): MintDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function isMintDraftComplete(draft: MintDraft) {
  const normalizedDraft = normalizeMintDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}

export function hasMintEditChanges(
  mint: Pick<Mint, "code" | "name">,
  draft: MintDraft
) {
  const normalizedCurrent = normalizeMintDraft(createMintDraft(mint))
  const normalizedDraft = normalizeMintDraft(draft)
  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}
