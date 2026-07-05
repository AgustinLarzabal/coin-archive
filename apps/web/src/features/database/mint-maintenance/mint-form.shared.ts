import type { MintOption } from "@workspace/db"

export type MintDraft = {
  code: string
  name: string
}

export const EMPTY_MINT_DRAFT: MintDraft = {
  code: "",
  name: "",
}

export function createMintDraft(mint: MintOption): MintDraft {
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
