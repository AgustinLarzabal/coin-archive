import {
  RULER_GROUP_DUPLICATE_CODE_ERROR,
  RULER_GROUP_GENERIC_SAVE_ERROR,
  RULER_GROUP_IN_USE_DELETE_ERROR,
  RULER_GROUP_MISSING_ERROR,
  RULER_GROUP_STALE_ERROR,
  createRulerGroupFieldErrorResult,
  createRulerGroupFormErrorResult,
} from "./ruler-group-mutation-errors"
import type { RulerGroupMutationResult } from "./ruler-group-mutation-errors"
import { RULER_GROUP_AUTHORIZATION_ERROR } from "./messages"

export { RULER_GROUP_AUTHORIZATION_ERROR } from "./messages"
export type { RulerGroupMutationResult } from "./ruler-group-mutation-errors"

export type RulerGroupAuthorizationErrorResult = {
  status: "error"
  formError: typeof RULER_GROUP_AUTHORIZATION_ERROR
}

export function createRulerGroupAuthorizationError(): RulerGroupAuthorizationErrorResult {
  return { status: "error", formError: RULER_GROUP_AUTHORIZATION_ERROR }
}
export function mapRulerGroupApiProblem(
  error: unknown
): RulerGroupMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createRulerGroupFormErrorResult(RULER_GROUP_AUTHORIZATION_ERROR)
    case "ruler_group_code_conflict":
      return createRulerGroupFieldErrorResult({
        code: RULER_GROUP_DUPLICATE_CODE_ERROR,
      })
    case "ruler_group_validation_failed":
      return mapValidationProblem(body)
    case "ruler_group_in_use":
      return createRulerGroupFormErrorResult(RULER_GROUP_IN_USE_DELETE_ERROR)
    case "ruler_group_not_found":
      return createRulerGroupFormErrorResult(RULER_GROUP_MISSING_ERROR)
    case "ruler_group_precondition_failed":
      return createRulerGroupFormErrorResult(RULER_GROUP_STALE_ERROR)
    default:
      return createRulerGroupFormErrorResult(RULER_GROUP_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): RulerGroupMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "ruler_group_code_too_long"
          ? "Ruler Group Code must be 255 characters or fewer."
          : parameter.code === "ruler_group_code_invalid"
            ? "Ruler Group Code must use lowercase letters, numbers, and hyphens only."
            : "Ruler Group Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "ruler_group_name_too_long"
          ? "Ruler Group Name must be 255 characters or fewer."
          : "Ruler Group Name cannot be blank."
    }
  }
  return createRulerGroupFieldErrorResult(fieldErrors)
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
