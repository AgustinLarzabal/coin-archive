import type { IssuerFieldErrors } from "./validation"

export {
  ISSUER_DUPLICATE_CODE_ERROR,
  ISSUER_GENERIC_SAVE_ERROR,
  ISSUER_COINS_DELETE_ERROR,
  ISSUER_CHILDREN_DELETE_ERROR,
  ISSUER_MISSING_ERROR,
} from "./messages"
export const ISSUER_STALE_ERROR =
  "Issuer changed after you opened it. Reload it before trying again."

export type IssuerMutationResult =
  | {
      status: "error"
      fieldErrors: IssuerFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createIssuerFieldErrorResult(
  fieldErrors: IssuerFieldErrors
): IssuerMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createIssuerFormErrorResult(
  formError: string
): IssuerMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
