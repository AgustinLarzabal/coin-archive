import type { EdgeFieldErrors } from "./edge-validation"

export const EDGE_DUPLICATE_CODE_ERROR =
  "An Edge with this code already exists."
export const EDGE_GENERIC_SAVE_ERROR = "Unable to save Edge right now."
export const EDGE_MISSING_ERROR = "Edge no longer exists."
export const EDGE_IN_USE_DELETE_ERROR =
  "Edge cannot be deleted while Coins still use it. Remove or reassign the Edge on those Coins before deleting it."
export const EDGE_INVALID_CODE_ERROR =
  "Edge Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_EDGE_CODE_CONSTRAINT = "edge_code_lower_unique_idx"
const INVALID_EDGE_CODE_CONSTRAINT = "edge_code_slug_check"
const EDGE_IN_USE_DELETE_CONSTRAINT = "coin_edge_id_edge_id_fk"

export type EdgeMutationResult =
  | { status: "error"; fieldErrors: EdgeFieldErrors; formError?: string }
  | { status: "success"; message: string }

export function createEdgeFieldErrorResult(
  fieldErrors: EdgeFieldErrors
): EdgeMutationResult {
  return { status: "error", fieldErrors }
}
export function createEdgeFormErrorResult(
  formError: string
): EdgeMutationResult {
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

export function createEdgePersistenceError(error: unknown): EdgeMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_EDGE_CODE_CONSTRAINT
    )
  ) {
    return createEdgeFieldErrorResult({ code: EDGE_DUPLICATE_CODE_ERROR })
  }
  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      EDGE_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createEdgeFormErrorResult(EDGE_IN_USE_DELETE_ERROR)
  }
  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_EDGE_CODE_CONSTRAINT
    )
  ) {
    return createEdgeFieldErrorResult({ code: EDGE_INVALID_CODE_ERROR })
  }
  return createEdgeFormErrorResult(EDGE_GENERIC_SAVE_ERROR)
}
