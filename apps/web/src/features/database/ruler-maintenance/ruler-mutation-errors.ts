import type { RulerFieldErrors } from "./ruler-validation"

export const RULER_DUPLICATE_CODE_ERROR =
  "A Ruler with this code already exists."
export const RULER_GENERIC_SAVE_ERROR = "Unable to save Ruler right now."
export const RULER_MISSING_ERROR = "Ruler no longer exists."
export const RULER_MISSING_RULER_GROUP_ERROR =
  "Selected Ruler Group no longer exists."
export const RULER_IN_USE_DELETE_GUIDANCE =
  "Remove those Ruler Attributions before deleting it."
export const RULER_IN_USE_DELETE_ERROR = `Ruler cannot be deleted while Coins still have Ruler Attributions to it. ${RULER_IN_USE_DELETE_GUIDANCE}`
export const RULER_INVALID_CODE_ERROR =
  "Ruler Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const FK_REFERENCE_POSTGRES_ERROR_CODE = "23503"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const DUPLICATE_RULER_CODE_CONSTRAINT = "ruler_code_unique_idx"
const INVALID_RULER_CODE_CONSTRAINT = "ruler_code_slug_check"
const RULER_RULER_GROUP_CONSTRAINT = "ruler_ruler_group_id_ruler_group_id_fk"
const RULER_IN_USE_DELETE_CONSTRAINT = "coin_ruler_ruler_id_ruler_id_fk"

export type RulerMutationResult =
  | { status: "error"; fieldErrors: RulerFieldErrors; formError?: string }
  | { status: "success"; message: string }

export function createRulerFieldErrorResult(
  fieldErrors: RulerFieldErrors
): RulerMutationResult {
  return { status: "error", fieldErrors }
}
export function createRulerFormErrorResult(
  formError: string
): RulerMutationResult {
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

export function createRulerPersistenceError(
  error: unknown
): RulerMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_RULER_CODE_CONSTRAINT
    )
  ) {
    return createRulerFieldErrorResult({ code: RULER_DUPLICATE_CODE_ERROR })
  }
  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      RULER_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createRulerFormErrorResult(RULER_IN_USE_DELETE_ERROR)
  }
  if (
    matchesPostgresConstraint(
      error,
      FK_REFERENCE_POSTGRES_ERROR_CODE,
      RULER_RULER_GROUP_CONSTRAINT
    )
  ) {
    return createRulerFieldErrorResult({
      rulerGroupId: RULER_MISSING_RULER_GROUP_ERROR,
    })
  }
  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_RULER_CODE_CONSTRAINT
    )
  ) {
    return createRulerFieldErrorResult({ code: RULER_INVALID_CODE_ERROR })
  }
  return createRulerFormErrorResult(RULER_GENERIC_SAVE_ERROR)
}
