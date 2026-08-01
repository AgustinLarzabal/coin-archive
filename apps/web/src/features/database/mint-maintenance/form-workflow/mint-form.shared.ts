import type { MintOption } from "@coin-archive/db"

import { createMintFieldErrorResult } from "../mint-mutation-errors"
import type { MintMutationResult } from "../mint-mutation-errors"
import {
  createMintInputSchema,
  updateMintInputSchema,
  validateMintInput,
} from "../mint-validation"

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

export function hasMintEditChanges(mint: MintOption, draft: MintDraft) {
  const normalizedCurrent = normalizeMintDraft(createMintDraft(mint))
  const normalizedDraft = normalizeMintDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function validateMintCreateDraft(
  draft: MintDraft
): MintMutationResult | null {
  const result = validateMintInput(createMintInputSchema, draft)
  return result.success ? null : createMintFieldErrorResult(result.fieldErrors)
}

export function validateMintUpdateDraft(
  mintId: string,
  draft: MintDraft
): MintMutationResult | null {
  const result = validateMintInput(updateMintInputSchema, {
    id: mintId,
    ...draft,
  })
  return result.success ? null : createMintFieldErrorResult(result.fieldErrors)
}
