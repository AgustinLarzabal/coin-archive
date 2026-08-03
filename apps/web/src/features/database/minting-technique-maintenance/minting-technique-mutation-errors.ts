import type { MintingTechniqueFieldErrors } from "./minting-technique-validation"

export {
  MINTING_TECHNIQUE_DUPLICATE_CODE_ERROR,
  MINTING_TECHNIQUE_GENERIC_SAVE_ERROR,
  MINTING_TECHNIQUE_IN_USE_DELETE_ERROR,
  MINTING_TECHNIQUE_MISSING_ERROR,
} from "./messages"
export const MINTING_TECHNIQUE_STALE_ERROR =
  "Minting Technique changed after you opened it. Reload it before trying again."

export type MintingTechniqueMutationResult =
  | {
      status: "error"
      fieldErrors: MintingTechniqueFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createMintingTechniqueFieldErrorResult(
  fieldErrors: MintingTechniqueFieldErrors
): MintingTechniqueMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createMintingTechniqueFormErrorResult(
  formError: string
): MintingTechniqueMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
