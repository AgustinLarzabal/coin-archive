import {
  COMPOSITION_DUPLICATE_CODE_ERROR,
  COMPOSITION_GENERIC_SAVE_ERROR,
  COMPOSITION_IN_USE_DELETE_ERROR,
  COMPOSITION_MISSING_ERROR,
  COMPOSITION_STALE_ERROR,
  createCompositionFieldErrorResult,
  createCompositionFormErrorResult,
} from "./composition-mutation-errors"
import type { CompositionMutationResult } from "./composition-mutation-errors"
import { COMPOSITION_AUTHORIZATION_ERROR } from "./messages"

export { COMPOSITION_AUTHORIZATION_ERROR } from "./messages"
export type { CompositionMutationResult } from "./composition-mutation-errors"

export type CompositionAuthorizationErrorResult = {
  status: "error"
  formError: typeof COMPOSITION_AUTHORIZATION_ERROR
}

export function createCompositionAuthorizationError(): CompositionAuthorizationErrorResult {
  return { status: "error", formError: COMPOSITION_AUTHORIZATION_ERROR }
}

export function mapCompositionApiProblem(
  error: unknown
): CompositionMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createCompositionFormErrorResult(COMPOSITION_AUTHORIZATION_ERROR)
    case "composition_code_conflict":
      return createCompositionFieldErrorResult({
        code: COMPOSITION_DUPLICATE_CODE_ERROR,
      })
    case "composition_validation_failed":
      return mapValidationProblem(body)
    case "composition_in_use":
      return createCompositionFormErrorResult(COMPOSITION_IN_USE_DELETE_ERROR)
    case "composition_not_found":
      return createCompositionFormErrorResult(COMPOSITION_MISSING_ERROR)
    case "composition_precondition_failed":
      return createCompositionFormErrorResult(COMPOSITION_STALE_ERROR)
    default:
      return createCompositionFormErrorResult(COMPOSITION_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): CompositionMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "composition_code_too_long"
          ? "Composition Code must be 255 characters or fewer."
          : parameter.code === "composition_code_invalid"
            ? "Composition Code must use lowercase letters, numbers, and single hyphens only."
            : "Composition Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "composition_name_too_long"
          ? "Composition Name must be 255 characters or fewer."
          : "Composition Name cannot be blank."
    }
  }
  return createCompositionFieldErrorResult(fieldErrors)
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
