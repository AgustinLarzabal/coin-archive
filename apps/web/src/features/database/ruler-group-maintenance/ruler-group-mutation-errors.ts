import type { RulerGroupFieldErrors } from "./ruler-group-validation"

export {
  RULER_GROUP_DUPLICATE_CODE_ERROR,
  RULER_GROUP_GENERIC_SAVE_ERROR,
  RULER_GROUP_IN_USE_DELETE_ERROR,
  RULER_GROUP_MISSING_ERROR,
} from "./messages"
export const RULER_GROUP_STALE_ERROR =
  "Ruler Group changed after you opened it. Reload it before trying again."

export type RulerGroupMutationResult =
  | {
      status: "error"
      fieldErrors: RulerGroupFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createRulerGroupFieldErrorResult(
  fieldErrors: RulerGroupFieldErrors
): RulerGroupMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createRulerGroupFormErrorResult(
  formError: string
): RulerGroupMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
