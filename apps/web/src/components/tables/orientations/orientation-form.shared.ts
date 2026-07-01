import type { OrientationOption } from "@workspace/db"

export type OrientationDraft = {
  code: string
  name: string
}

export const EMPTY_ORIENTATION_DRAFT: OrientationDraft = {
  code: "",
  name: "",
}

export function createOrientationDraft(orientation: OrientationOption): OrientationDraft {
  return {
    code: orientation.code,
    name: orientation.name,
  }
}

export function normalizeOrientationDraft(draft: OrientationDraft): OrientationDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function isOrientationDraftComplete(draft: OrientationDraft) {
  const normalizedDraft = normalizeOrientationDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}
