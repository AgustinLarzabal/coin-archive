import type { Orientation as OrientationOption } from "@coin-archive/api"

import { createOrientationFieldErrorResult } from "../orientation-mutation-errors"
import type { OrientationMutationResult } from "../orientation-mutation-errors"
import {
  createOrientationInputSchema,
  validateOrientationInput,
} from "../orientation-validation"

export type OrientationDraft = {
  code: string
  name: string
}

export const EMPTY_ORIENTATION_DRAFT: OrientationDraft = {
  code: "",
  name: "",
}

export function createOrientationDraft(
  orientation: OrientationOption
): OrientationDraft {
  return {
    code: orientation.code,
    name: orientation.name,
  }
}

export function normalizeOrientationDraft(
  draft: OrientationDraft
): OrientationDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function isOrientationDraftComplete(draft: OrientationDraft) {
  const normalizedDraft = normalizeOrientationDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}

export function hasOrientationEditChanges(
  orientation: OrientationOption,
  draft: OrientationDraft
) {
  const normalizedCurrent = normalizeOrientationDraft(
    createOrientationDraft(orientation)
  )
  const normalizedDraft = normalizeOrientationDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function validateOrientationCreateDraft(
  draft: OrientationDraft
): OrientationMutationResult | null {
  const result = validateOrientationInput(createOrientationInputSchema, draft)

  return result.success
    ? null
    : createOrientationFieldErrorResult(result.fieldErrors)
}

export function validateOrientationUpdateDraft(
  _orientationId: string,
  draft: OrientationDraft
): OrientationMutationResult | null {
  const result = validateOrientationInput(createOrientationInputSchema, draft)

  return result.success
    ? null
    : createOrientationFieldErrorResult(result.fieldErrors)
}
