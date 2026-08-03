import type { Rim } from "@coin-archive/api"

export type RimDraft = {
  code: string
  name: string
}

export const EMPTY_RIM_DRAFT: RimDraft = {
  code: "",
  name: "",
}

export function createRimDraft(rim: Pick<Rim, "code" | "name">): RimDraft {
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

export function hasRimEditChanges(
  rim: Pick<Rim, "code" | "name">,
  draft: RimDraft
) {
  const normalizedCurrent = normalizeRimDraft(createRimDraft(rim))
  const normalizedDraft = normalizeRimDraft(draft)
  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}
