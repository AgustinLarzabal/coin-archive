import type { RulerGroupOption } from "@coin-archive/db"

export type RulerGroupDraft = {
  code: string
  name: string
}

export const EMPTY_RULER_GROUP_DRAFT: RulerGroupDraft = {
  code: "",
  name: "",
}

export function createRulerGroupDraft(
  rulerGroup: RulerGroupOption
): RulerGroupDraft {
  return {
    code: rulerGroup.code,
    name: rulerGroup.name,
  }
}

export function normalizeRulerGroupDraft(
  draft: RulerGroupDraft
): RulerGroupDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function isRulerGroupDraftComplete(draft: RulerGroupDraft) {
  const normalizedDraft = normalizeRulerGroupDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}
