import type { Shape } from "@coin-archive/api"

export type ShapeDraft = {
  code: string
  name: string
}

export const EMPTY_SHAPE_DRAFT: ShapeDraft = {
  code: "",
  name: "",
}

export function createShapeDraft(
  shape: Pick<Shape, "code" | "name">
): ShapeDraft {
  return {
    code: shape.code,
    name: shape.name,
  }
}

export function normalizeShapeDraft(draft: ShapeDraft): ShapeDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function isShapeDraftComplete(draft: ShapeDraft) {
  const normalizedDraft = normalizeShapeDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}

export function hasShapeEditChanges(
  shape: Pick<Shape, "code" | "name">,
  draft: ShapeDraft
) {
  const normalizedCurrent = normalizeShapeDraft(createShapeDraft(shape))
  const normalizedDraft = normalizeShapeDraft(draft)
  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}
