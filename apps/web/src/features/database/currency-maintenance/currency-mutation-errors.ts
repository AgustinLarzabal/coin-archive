import type { CurrencyFieldErrors } from "./validation"

export {
  CURRENCY_DUPLICATE_CODE_ERROR,
  CURRENCY_GENERIC_SAVE_ERROR,
  CURRENCY_IN_USE_DELETE_ERROR,
  CURRENCY_MISSING_ERROR,
} from "./messages"
export const CURRENCY_STALE_ERROR =
  "Currency changed after you opened it. Reload it before trying again."

export type CurrencyMutationResult =
  | {
      status: "error"
      fieldErrors: CurrencyFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createCurrencyFieldErrorResult(
  fieldErrors: CurrencyFieldErrors
): CurrencyMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createCurrencyFormErrorResult(
  formError: string
): CurrencyMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
