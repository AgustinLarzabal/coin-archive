import type { CompositionFieldErrors } from "./validation"

export {
  COMPOSITION_DUPLICATE_CODE_ERROR,
  COMPOSITION_GENERIC_SAVE_ERROR,
  COMPOSITION_IN_USE_DELETE_ERROR,
  COMPOSITION_MISSING_ERROR,
} from "./messages"
export const COMPOSITION_STALE_ERROR =
  "Composition changed after you opened it. Reload it before trying again."

export type CompositionMutationResult =
  | {
      status: "error"
      fieldErrors: CompositionFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createCompositionFieldErrorResult(
  fieldErrors: CompositionFieldErrors
): CompositionMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createCompositionFormErrorResult(
  formError: string
): CompositionMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
