import {
  ORIENTATION_DUPLICATE_CODE_ERROR,
  ORIENTATION_GENERIC_SAVE_ERROR,
  ORIENTATION_IN_USE_DELETE_ERROR,
  ORIENTATION_INVALID_CODE_ERROR,
  ORIENTATION_MISSING_ERROR,
  ORIENTATION_STALE_ERROR,
  createOrientationFieldErrorResult,
  createOrientationFormErrorResult,
} from "./orientation-mutation-errors"
import type { OrientationMutationResult } from "./orientation-mutation-errors"

export const ORIENTATION_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Orientations."

export type OrientationAuthorizationErrorResult = {
  status: "error"
  formError: typeof ORIENTATION_AUTHORIZATION_ERROR
}

export function createOrientationAuthorizationError(): OrientationAuthorizationErrorResult {
  return { status: "error", formError: ORIENTATION_AUTHORIZATION_ERROR }
}

export function mapOrientationApiProblem(
  error: unknown
): OrientationMutationResult {
  const code = getMaintenanceProblemCode(error)
  switch (code) {
    case "authentication_required":
    case "editor_access_required":
      return createOrientationFormErrorResult(ORIENTATION_AUTHORIZATION_ERROR)
    case "orientation_code_conflict":
      return createOrientationFieldErrorResult({
        code: ORIENTATION_DUPLICATE_CODE_ERROR,
      })
    case "orientation_validation_failed":
      return mapValidationProblem(error)
    case "orientation_in_use":
      return createOrientationFormErrorResult(ORIENTATION_IN_USE_DELETE_ERROR)
    case "orientation_not_found":
      return createOrientationFormErrorResult(ORIENTATION_MISSING_ERROR)
    case "orientation_precondition_failed":
      return createOrientationFormErrorResult(ORIENTATION_STALE_ERROR)
    default:
      return createOrientationFormErrorResult(ORIENTATION_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(error: unknown): OrientationMutationResult {
  const body = getProblemBody(error)
  const invalidParams =
    body !== undefined &&
    "invalidParams" in body &&
    Array.isArray(body.invalidParams)
      ? body.invalidParams
      : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if ("name" in parameter && parameter.name === "/code") {
      fieldErrors.code = ORIENTATION_INVALID_CODE_ERROR
    }
    if ("name" in parameter && parameter.name === "/name") {
      fieldErrors.name = "Orientation Name cannot be blank."
    }
  }
  return createOrientationFieldErrorResult(fieldErrors)
}

function getMaintenanceProblemCode(error: unknown) {
  const body = getProblemBody(error)
  return body !== undefined && "code" in body && typeof body.code === "string"
    ? body.code
    : undefined
}

function getProblemBody(error: unknown): Record<string, unknown> | undefined {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return undefined
  }
  const data = error.data
  if (typeof data !== "object" || data === null || !("body" in data)) {
    return undefined
  }
  return typeof data.body === "object" && data.body !== null
    ? (data.body as Record<string, unknown>)
    : undefined
}
