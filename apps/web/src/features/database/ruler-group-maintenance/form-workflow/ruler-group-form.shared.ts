import type { RulerGroup } from "@coin-archive/api"

export type RulerGroupDraft = {
  code: string
  name: string
}

export const EMPTY_RULER_GROUP_DRAFT: RulerGroupDraft = {
  code: "",
  name: "",
}

export function createRulerGroupDraft(
  rulerGroup: Pick<RulerGroup, "code" | "name">
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

export function hasRulerGroupEditChanges(
  rulerGroup: Pick<RulerGroup, "code" | "name">,
  draft: RulerGroupDraft
) {
  const normalizedCurrent = normalizeRulerGroupDraft(
    createRulerGroupDraft(rulerGroup)
  )
  const normalizedDraft = normalizeRulerGroupDraft(draft)
  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}
