import type { CatalogueFieldErrors } from "./catalogue-validation"

export const CATALOGUE_DUPLICATE_CODE_ERROR =
  "A Catalogue with this code already exists."
export const CATALOGUE_GENERIC_SAVE_ERROR =
  "Unable to save Catalogue right now."
export const CATALOGUE_MISSING_ERROR = "Catalogue no longer exists."
export const CATALOGUE_IN_USE_DELETE_ERROR =
  "Catalogue cannot be deleted while coin references still use it."
export const CATALOGUE_STALE_ERROR =
  "Catalogue changed after you opened it. Reload it before trying again."

export type CatalogueMutationResult =
  | {
      status: "error"
      fieldErrors: CatalogueFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createCatalogueFieldErrorResult(
  fieldErrors: CatalogueFieldErrors
): CatalogueMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createCatalogueFormErrorResult(
  formError: string
): CatalogueMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
