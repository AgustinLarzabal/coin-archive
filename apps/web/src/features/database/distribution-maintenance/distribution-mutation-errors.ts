import type { DistributionFieldErrors } from "./validation"

export {
  DISTRIBUTION_DUPLICATE_CODE_ERROR,
  DISTRIBUTION_GENERIC_SAVE_ERROR,
  DISTRIBUTION_IN_USE_DELETE_ERROR,
  DISTRIBUTION_MISSING_ERROR,
} from "./messages"
export const DISTRIBUTION_STALE_ERROR =
  "Distribution changed after you opened it. Reload it before trying again."

export type DistributionMutationResult =
  | {
      status: "error"
      fieldErrors: DistributionFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createDistributionFieldErrorResult(
  fieldErrors: DistributionFieldErrors
): DistributionMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createDistributionFormErrorResult(
  formError: string
): DistributionMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
