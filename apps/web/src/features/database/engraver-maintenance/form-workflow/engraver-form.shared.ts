import type { Engraver } from "@coin-archive/api"

export type EngraverDraft = {
  code: string
  name: string
}

export const EMPTY_ENGRAVER_DRAFT: EngraverDraft = {
  code: "",
  name: "",
}

export function createEngraverDraft(
  engraver: Pick<Engraver, "code" | "name">
): EngraverDraft {
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

export function hasEngraverEditChanges(
  engraver: Pick<Engraver, "code" | "name">,
  draft: EngraverDraft
) {
  const normalizedCurrent = normalizeEngraverDraft(
    createEngraverDraft(engraver)
  )
  const normalizedDraft = normalizeEngraverDraft(draft)
  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}
