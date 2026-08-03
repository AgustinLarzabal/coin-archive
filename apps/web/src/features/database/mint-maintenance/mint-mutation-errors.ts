import type { MintFieldErrors } from "./mint-validation"

export {
  MINT_DUPLICATE_CODE_ERROR,
  MINT_GENERIC_SAVE_ERROR,
  MINT_IN_USE_DELETE_ERROR,
  MINT_MISSING_ERROR,
} from "./messages"
export const MINT_STALE_ERROR =
  "Mint changed after you opened it. Reload it before trying again."

export type MintMutationResult =
  | {
      status: "error"
      fieldErrors: MintFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createMintFieldErrorResult(
  fieldErrors: MintFieldErrors
): MintMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createMintFormErrorResult(
  formError: string
): MintMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
