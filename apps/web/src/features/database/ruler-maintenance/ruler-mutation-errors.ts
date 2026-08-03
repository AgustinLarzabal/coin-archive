import type { RulerFieldErrors } from "./ruler-validation"

export {
  RULER_DUPLICATE_CODE_ERROR,
  RULER_GENERIC_SAVE_ERROR,
  RULER_IN_USE_DELETE_ERROR,
  RULER_IN_USE_DELETE_GUIDANCE,
  RULER_MISSING_ERROR,
  RULER_MISSING_RULER_GROUP_ERROR,
} from "./messages"
export const RULER_STALE_ERROR =
  "Ruler changed after you opened it. Reload it before trying again."

export type RulerMutationResult =
  | {
      status: "error"
      fieldErrors: RulerFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createRulerFieldErrorResult(
  fieldErrors: RulerFieldErrors
): RulerMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createRulerFormErrorResult(
  formError: string
): RulerMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
