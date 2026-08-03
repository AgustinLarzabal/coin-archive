import type { RimFieldErrors } from "./rim-validation"

export {
  RIM_DUPLICATE_CODE_ERROR,
  RIM_GENERIC_SAVE_ERROR,
  RIM_IN_USE_DELETE_ERROR,
  RIM_MISSING_ERROR,
} from "./messages"
export const RIM_STALE_ERROR =
  "Rim changed after you opened it. Reload it before trying again."

export type RimMutationResult =
  | {
      status: "error"
      fieldErrors: RimFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createRimFieldErrorResult(
  fieldErrors: RimFieldErrors
): RimMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createRimFormErrorResult(formError: string): RimMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
