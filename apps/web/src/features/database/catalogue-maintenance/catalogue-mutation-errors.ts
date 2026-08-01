import type { CatalogueFieldErrors } from "./catalogue-validation"

export const CATALOGUE_DUPLICATE_CODE_ERROR =
  "A Catalogue with this code already exists."
export const CATALOGUE_GENERIC_SAVE_ERROR =
  "Unable to save Catalogue right now."
export const CATALOGUE_MISSING_ERROR = "Catalogue no longer exists."
export const CATALOGUE_IN_USE_DELETE_ERROR =
  "Catalogue cannot be deleted while coin references still use it."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const DUPLICATE_CATALOGUE_CODE_CONSTRAINT =
  "catalogue_code_lower_unique_idx"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const CATALOGUE_IN_USE_DELETE_CONSTRAINT =
  "coin_reference_catalogue_id_catalogue_id_fk"

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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function unwrapPostgresError(error: unknown): Record<string, unknown> | null {
  if (!isObjectRecord(error)) {
    return null
  }

  const postgresError = "cause" in error ? error.cause : error

  return isObjectRecord(postgresError) ? postgresError : null
}

function matchesPostgresConstraint(
  error: unknown,
  code: string,
  constraintName: string
) {
  const postgresError = unwrapPostgresError(error)

  return (
    postgresError !== null &&
    postgresError.code === code &&
    postgresError.constraint_name === constraintName
  )
}

export function createCataloguePersistenceError(
  error: unknown
): CatalogueMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_CATALOGUE_CODE_CONSTRAINT
    )
  ) {
    return createCatalogueFieldErrorResult({
      code: CATALOGUE_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      CATALOGUE_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createCatalogueFormErrorResult(CATALOGUE_IN_USE_DELETE_ERROR)
  }

  return createCatalogueFormErrorResult(CATALOGUE_GENERIC_SAVE_ERROR)
}
