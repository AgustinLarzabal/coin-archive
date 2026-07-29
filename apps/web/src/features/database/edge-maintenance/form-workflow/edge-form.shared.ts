import type { EdgeOption } from "@coin-archive/db"

export type EdgeDraft = {
  code: string
  name: string
}

export const EMPTY_EDGE_DRAFT: EdgeDraft = {
  code: "",
  name: "",
}

export function createEdgeDraft(edge: EdgeOption): EdgeDraft {
  return {
    code: edge.code,
    name: edge.name,
  }
}

export function normalizeEdgeDraft(draft: EdgeDraft): EdgeDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function isEdgeDraftComplete(draft: EdgeDraft) {
  const normalizedDraft = normalizeEdgeDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}
