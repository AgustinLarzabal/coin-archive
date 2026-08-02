import type { OrientationFieldErrors } from "./orientation-validation"

export const ORIENTATION_DUPLICATE_CODE_ERROR =
  "An Orientation with this code already exists."
export const ORIENTATION_GENERIC_SAVE_ERROR =
  "Unable to save Orientation right now."
export const ORIENTATION_MISSING_ERROR = "Orientation no longer exists."
export const ORIENTATION_STALE_ERROR =
  "This Orientation changed after you opened it. Reload and try again."
export const ORIENTATION_IN_USE_DELETE_GUIDANCE =
  "Existing Coins must have the Orientation removed or reassigned before deletion."
export const ORIENTATION_IN_USE_DELETE_ERROR = `Orientation cannot be deleted while Coins still use it. ${ORIENTATION_IN_USE_DELETE_GUIDANCE}`
export const ORIENTATION_INVALID_CODE_ERROR =
  "Orientation Code must use lowercase letters, numbers, and hyphens only."

export type OrientationMutationResult =
  | {
      status: "error"
      fieldErrors: OrientationFieldErrors
      formError?: string
    }
  | { status: "success"; message: string }

export function createOrientationFieldErrorResult(
  fieldErrors: OrientationFieldErrors
): OrientationMutationResult {
  return { status: "error", fieldErrors }
}

export function createOrientationFormErrorResult(
  formError: string
): OrientationMutationResult {
  return { status: "error", fieldErrors: {}, formError }
}
