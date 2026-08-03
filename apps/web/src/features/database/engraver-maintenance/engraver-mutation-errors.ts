import type { EngraverFieldErrors } from "./engraver-validation"

export {
  ENGRAVER_DUPLICATE_CODE_ERROR,
  ENGRAVER_GENERIC_SAVE_ERROR,
  ENGRAVER_IN_USE_DELETE_ERROR,
  ENGRAVER_MISSING_ERROR,
} from "./messages"
export const ENGRAVER_STALE_ERROR =
  "Engraver changed after you opened it. Reload it before trying again."

export type EngraverMutationResult =
  | {
      status: "error"
      fieldErrors: EngraverFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createEngraverFieldErrorResult(
  fieldErrors: EngraverFieldErrors
): EngraverMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createEngraverFormErrorResult(
  formError: string
): EngraverMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
