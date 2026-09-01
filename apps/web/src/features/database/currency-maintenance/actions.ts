import {
  CURRENCY_DUPLICATE_CODE_ERROR,
  CURRENCY_GENERIC_SAVE_ERROR,
  CURRENCY_IN_USE_DELETE_ERROR,
  CURRENCY_MISSING_ERROR,
  CURRENCY_STALE_ERROR,
  createCurrencyFieldErrorResult,
  createCurrencyFormErrorResult,
} from "./currency-mutation-errors"
import type { CurrencyMutationResult } from "./currency-mutation-errors"
import { CURRENCY_AUTHORIZATION_ERROR } from "./messages"

export { CURRENCY_AUTHORIZATION_ERROR } from "./messages"
export type { CurrencyMutationResult } from "./currency-mutation-errors"

export type CurrencyAuthorizationErrorResult = {
  status: "error"
  formError: typeof CURRENCY_AUTHORIZATION_ERROR
}

export function createCurrencyAuthorizationError(): CurrencyAuthorizationErrorResult {
  return { status: "error", formError: CURRENCY_AUTHORIZATION_ERROR }
}

export function mapCurrencyApiProblem(error: unknown): CurrencyMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createCurrencyFormErrorResult(CURRENCY_AUTHORIZATION_ERROR)
    case "currency_code_conflict":
      return createCurrencyFieldErrorResult({
        code: CURRENCY_DUPLICATE_CODE_ERROR,
      })
    case "currency_validation_failed":
      return mapValidationProblem(body)
    case "currency_in_use":
      return createCurrencyFormErrorResult(CURRENCY_IN_USE_DELETE_ERROR)
    case "currency_not_found":
      return createCurrencyFormErrorResult(CURRENCY_MISSING_ERROR)
    case "currency_precondition_failed":
      return createCurrencyFormErrorResult(CURRENCY_STALE_ERROR)
    default:
      return createCurrencyFormErrorResult(CURRENCY_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): CurrencyMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string; fullName?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "currency_code_too_long"
          ? "Currency Code must be 255 characters or fewer."
          : parameter.code === "currency_code_invalid"
            ? "Currency Code must use lowercase letters, numbers, and single hyphens only."
            : "Currency Code cannot be blank."
    }
    if (parameter.name === "/fullName") {
      fieldErrors.fullName =
        parameter.code === "currency_full_name_too_long"
          ? "Currency Full Name must be 255 characters or fewer."
          : "Currency Full Name cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "currency_name_too_long"
          ? "Currency Name must be 255 characters or fewer."
          : "Currency Name cannot be blank."
    }
  }
  return createCurrencyFieldErrorResult(fieldErrors)
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
