import type { EngraverOption } from "@workspace/db"

export type EngraverDraft = {
  code: string
  name: string
}

export const EMPTY_ENGRAVER_DRAFT: EngraverDraft = {
  code: "",
  name: "",
}

export function createEngraverDraft(engraver: EngraverOption): EngraverDraft {
  return {
    code: engraver.code,
    name: engraver.name,
  }
}

export function normalizeEngraverDraft(draft: EngraverDraft): EngraverDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function isEngraverDraftComplete(draft: EngraverDraft) {
  const normalizedDraft = normalizeEngraverDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}
