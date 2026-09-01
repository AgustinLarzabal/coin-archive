import {
  DISTRIBUTION_DUPLICATE_CODE_ERROR,
  DISTRIBUTION_GENERIC_SAVE_ERROR,
  DISTRIBUTION_IN_USE_DELETE_ERROR,
  DISTRIBUTION_MISSING_ERROR,
  DISTRIBUTION_STALE_ERROR,
  createDistributionFieldErrorResult,
  createDistributionFormErrorResult,
} from "./distribution-mutation-errors"
import type { DistributionMutationResult } from "./distribution-mutation-errors"
import { DISTRIBUTION_AUTHORIZATION_ERROR } from "./messages"

export { DISTRIBUTION_AUTHORIZATION_ERROR } from "./messages"
export type { DistributionMutationResult } from "./distribution-mutation-errors"

export type DistributionAuthorizationErrorResult = {
  status: "error"
  formError: typeof DISTRIBUTION_AUTHORIZATION_ERROR
}

export function createDistributionAuthorizationError(): DistributionAuthorizationErrorResult {
  return { status: "error", formError: DISTRIBUTION_AUTHORIZATION_ERROR }
}

export function mapDistributionApiProblem(
  error: unknown
): DistributionMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createDistributionFormErrorResult(DISTRIBUTION_AUTHORIZATION_ERROR)
    case "distribution_code_conflict":
      return createDistributionFieldErrorResult({
        code: DISTRIBUTION_DUPLICATE_CODE_ERROR,
      })
    case "distribution_validation_failed":
      return mapValidationProblem(body)
    case "distribution_in_use":
      return createDistributionFormErrorResult(DISTRIBUTION_IN_USE_DELETE_ERROR)
    case "distribution_not_found":
      return createDistributionFormErrorResult(DISTRIBUTION_MISSING_ERROR)
    case "distribution_precondition_failed":
      return createDistributionFormErrorResult(DISTRIBUTION_STALE_ERROR)
    default:
      return createDistributionFormErrorResult(DISTRIBUTION_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): DistributionMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "distribution_code_too_long"
          ? "Distribution Code must be 255 characters or fewer."
          : parameter.code === "distribution_code_invalid"
            ? "Distribution Code must use lowercase letters, numbers, and single hyphens only."
            : "Distribution Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "distribution_name_too_long"
          ? "Distribution Name must be 255 characters or fewer."
          : "Distribution Name cannot be blank."
    }
  }
  return createDistributionFieldErrorResult(fieldErrors)
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
