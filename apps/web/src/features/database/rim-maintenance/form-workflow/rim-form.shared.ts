import type { RimOption } from "@workspace/db"

export type RimDraft = {
  code: string
  name: string
}

export const EMPTY_RIM_DRAFT: RimDraft = {
  code: "",
  name: "",
}

export function createRimDraft(rim: RimOption): RimDraft {
  return {
    code: rim.code,
    name: rim.name,
  }
}

export function normalizeRimDraft(draft: RimDraft): RimDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function isRimDraftComplete(draft: RimDraft) {
  const normalizedDraft = normalizeRimDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}
