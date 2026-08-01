import type { EdgeOption } from "@coin-archive/db"

import { createEdgeFieldErrorResult } from "../edge-mutation-errors"
import type { EdgeMutationResult } from "../edge-mutation-errors"
import {
  createEdgeInputSchema,
  updateEdgeInputSchema,
  validateEdgeInput,
} from "../edge-validation"

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

export function hasEdgeEditChanges(edge: EdgeOption, draft: EdgeDraft) {
  const normalizedCurrent = normalizeEdgeDraft(createEdgeDraft(edge))
  const normalizedDraft = normalizeEdgeDraft(draft)
  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function validateEdgeCreateDraft(
  draft: EdgeDraft
): EdgeMutationResult | null {
  const result = validateEdgeInput(createEdgeInputSchema, draft)
  return result.success ? null : createEdgeFieldErrorResult(result.fieldErrors)
}

export function validateEdgeUpdateDraft(
  edgeId: string,
  draft: EdgeDraft
): EdgeMutationResult | null {
  const result = validateEdgeInput(updateEdgeInputSchema, {
    id: edgeId,
    ...draft,
  })
  return result.success ? null : createEdgeFieldErrorResult(result.fieldErrors)
}
