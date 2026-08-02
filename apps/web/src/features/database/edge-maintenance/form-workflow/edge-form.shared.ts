import type { Edge } from "@coin-archive/api"

export type EdgeDraft = {
  code: string
  name: string
}

export const EMPTY_EDGE_DRAFT: EdgeDraft = {
  code: "",
  name: "",
}

export function createEdgeDraft(edge: Pick<Edge, "code" | "name">): EdgeDraft {
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

export function hasEdgeEditChanges(
  edge: Pick<Edge, "code" | "name">,
  draft: EdgeDraft
) {
  const normalizedCurrent = normalizeEdgeDraft(createEdgeDraft(edge))
  const normalizedDraft = normalizeEdgeDraft(draft)
  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}
