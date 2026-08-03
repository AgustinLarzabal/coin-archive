import type { ShapeFieldErrors } from "./shape-validation"

export {
  SHAPE_DUPLICATE_CODE_ERROR,
  SHAPE_GENERIC_SAVE_ERROR,
  SHAPE_IN_USE_DELETE_ERROR,
  SHAPE_MISSING_ERROR,
} from "./messages"
export const SHAPE_STALE_ERROR =
  "Shape changed after you opened it. Reload it before trying again."

export type ShapeMutationResult =
  | {
      status: "error"
      fieldErrors: ShapeFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createShapeFieldErrorResult(
  fieldErrors: ShapeFieldErrors
): ShapeMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createShapeFormErrorResult(
  formError: string
): ShapeMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
