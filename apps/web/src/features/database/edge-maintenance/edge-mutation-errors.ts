import type { EdgeFieldErrors } from "./edge-validation"

export {
  EDGE_DUPLICATE_CODE_ERROR,
  EDGE_GENERIC_SAVE_ERROR,
  EDGE_IN_USE_DELETE_ERROR,
  EDGE_MISSING_ERROR,
} from "./messages"
export const EDGE_STALE_ERROR =
  "Edge changed after you opened it. Reload it before trying again."

export type EdgeMutationResult =
  | {
      status: "error"
      fieldErrors: EdgeFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createEdgeFieldErrorResult(
  fieldErrors: EdgeFieldErrors
): EdgeMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createEdgeFormErrorResult(
  formError: string
): EdgeMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
