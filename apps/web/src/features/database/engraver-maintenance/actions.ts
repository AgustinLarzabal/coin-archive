import {
  ENGRAVER_DUPLICATE_CODE_ERROR,
  ENGRAVER_GENERIC_SAVE_ERROR,
  ENGRAVER_IN_USE_DELETE_ERROR,
  ENGRAVER_MISSING_ERROR,
  ENGRAVER_STALE_ERROR,
  createEngraverFieldErrorResult,
  createEngraverFormErrorResult,
} from "./engraver-mutation-errors"
import type { EngraverMutationResult } from "./engraver-mutation-errors"
import { ENGRAVER_AUTHORIZATION_ERROR } from "./messages"

export { ENGRAVER_AUTHORIZATION_ERROR } from "./messages"
export type { EngraverMutationResult } from "./engraver-mutation-errors"

export type EngraverAuthorizationErrorResult = {
  status: "error"
  formError: typeof ENGRAVER_AUTHORIZATION_ERROR
}

export function createEngraverAuthorizationError(): EngraverAuthorizationErrorResult {
  return { status: "error", formError: ENGRAVER_AUTHORIZATION_ERROR }
}

export function mapEngraverApiProblem(error: unknown): EngraverMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createEngraverFormErrorResult(ENGRAVER_AUTHORIZATION_ERROR)
    case "engraver_code_conflict":
      return createEngraverFieldErrorResult({
        code: ENGRAVER_DUPLICATE_CODE_ERROR,
      })
    case "engraver_validation_failed":
      return mapValidationProblem(body)
    case "engraver_in_use":
      return createEngraverFormErrorResult(ENGRAVER_IN_USE_DELETE_ERROR)
    case "engraver_not_found":
      return createEngraverFormErrorResult(ENGRAVER_MISSING_ERROR)
    case "engraver_precondition_failed":
      return createEngraverFormErrorResult(ENGRAVER_STALE_ERROR)
    default:
      return createEngraverFormErrorResult(ENGRAVER_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): EngraverMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "engraver_code_too_long"
          ? "Engraver Code must be 255 characters or fewer."
          : parameter.code === "engraver_code_invalid"
            ? "Engraver Code must use lowercase letters, numbers, and single hyphens only."
            : "Engraver Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "engraver_name_too_long"
          ? "Engraver Name must be 255 characters or fewer."
          : "Engraver Name cannot be blank."
    }
  }
  return createEngraverFieldErrorResult(fieldErrors)
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
