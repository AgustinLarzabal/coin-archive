import {
  SHAPE_DUPLICATE_CODE_ERROR,
  SHAPE_GENERIC_SAVE_ERROR,
  SHAPE_IN_USE_DELETE_ERROR,
  SHAPE_MISSING_ERROR,
  SHAPE_STALE_ERROR,
  createShapeFieldErrorResult,
  createShapeFormErrorResult,
} from "./shape-mutation-errors"
import type { ShapeMutationResult } from "./shape-mutation-errors"
import {
  SHAPE_AUTHORIZATION_ERROR,
} from "./messages"

export { SHAPE_AUTHORIZATION_ERROR } from "./messages"
export type { ShapeMutationResult } from "./shape-mutation-errors"

export type ShapeAuthorizationErrorResult = {
  status: "error"
  formError: typeof SHAPE_AUTHORIZATION_ERROR
}

export function createShapeAuthorizationError(): ShapeAuthorizationErrorResult {
  return { status: "error", formError: SHAPE_AUTHORIZATION_ERROR }
}
export function mapShapeApiProblem(error: unknown): ShapeMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createShapeFormErrorResult(SHAPE_AUTHORIZATION_ERROR)
    case "shape_code_conflict":
      return createShapeFieldErrorResult({
        code: SHAPE_DUPLICATE_CODE_ERROR,
      })
    case "shape_validation_failed":
      return mapValidationProblem(body)
    case "shape_in_use":
      return createShapeFormErrorResult(SHAPE_IN_USE_DELETE_ERROR)
    case "shape_not_found":
      return createShapeFormErrorResult(SHAPE_MISSING_ERROR)
    case "shape_precondition_failed":
      return createShapeFormErrorResult(SHAPE_STALE_ERROR)
    default:
      return createShapeFormErrorResult(SHAPE_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): ShapeMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "shape_code_too_long"
          ? "Shape Code must be 255 characters or fewer."
          : parameter.code === "shape_code_invalid"
            ? "Shape Code must use lowercase letters, numbers, and single hyphens only."
            : "Shape Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "shape_name_too_long"
          ? "Shape Name must be 255 characters or fewer."
          : "Shape Name cannot be blank."
    }
  }
  return createShapeFieldErrorResult(fieldErrors)
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
