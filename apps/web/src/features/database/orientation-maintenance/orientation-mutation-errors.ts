import type { OrientationFieldErrors } from "./orientation-validation"

export const ORIENTATION_DUPLICATE_CODE_ERROR =
  "An Orientation with this code already exists."
export const ORIENTATION_GENERIC_SAVE_ERROR =
  "Unable to save Orientation right now."
export const ORIENTATION_MISSING_ERROR = "Orientation no longer exists."
export const ORIENTATION_IN_USE_DELETE_GUIDANCE =
  "Existing Coins must have the Orientation removed or reassigned before deletion."
export const ORIENTATION_IN_USE_DELETE_ERROR = `Orientation cannot be deleted while Coins still use it. ${ORIENTATION_IN_USE_DELETE_GUIDANCE}`
export const ORIENTATION_INVALID_CODE_ERROR =
  "Orientation Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_ORIENTATION_CODE_CONSTRAINT =
  "orientation_code_lower_unique_idx"
const INVALID_ORIENTATION_CODE_CONSTRAINT = "orientation_code_slug_check"
const ORIENTATION_IN_USE_DELETE_CONSTRAINT =
  "coin_orientation_id_orientation_id_fk"

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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function matchesPostgresConstraint(
  error: unknown,
  code: string,
  constraintName: string
) {
  if (!isObjectRecord(error)) return false

  const postgresError = "cause" in error ? error.cause : error

  return (
    isObjectRecord(postgresError) &&
    postgresError.code === code &&
    postgresError.constraint_name === constraintName
  )
}

export function createOrientationPersistenceError(
  error: unknown
): OrientationMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_ORIENTATION_CODE_CONSTRAINT
    )
  ) {
    return createOrientationFieldErrorResult({
      code: ORIENTATION_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      ORIENTATION_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createOrientationFormErrorResult(ORIENTATION_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_ORIENTATION_CODE_CONSTRAINT
    )
  ) {
    return createOrientationFieldErrorResult({
      code: ORIENTATION_INVALID_CODE_ERROR,
    })
  }

  return createOrientationFormErrorResult(ORIENTATION_GENERIC_SAVE_ERROR)
}
