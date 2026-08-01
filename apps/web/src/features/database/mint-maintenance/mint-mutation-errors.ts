import type { MintFieldErrors } from "./mint-validation"

export const MINT_DUPLICATE_CODE_ERROR = "A Mint with this code already exists."
export const MINT_GENERIC_SAVE_ERROR = "Unable to save Mint right now."
export const MINT_MISSING_ERROR = "Mint no longer exists."
export const MINT_IN_USE_DELETE_GUIDANCE =
  "Remove or reassign those Coin Mint Attributions before deleting the Mint."
export const MINT_IN_USE_DELETE_ERROR = `Mint cannot be deleted while Coin Mint Attributions still use it. ${MINT_IN_USE_DELETE_GUIDANCE}`
export const MINT_INVALID_CODE_ERROR =
  "Mint Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_MINT_CODE_CONSTRAINT = "mint_code_lower_unique_idx"
const INVALID_MINT_CODE_CONSTRAINT = "mint_code_slug_check"
const MINT_IN_USE_DELETE_CONSTRAINT = "coin_mint_mint_id_mint_id_fk"

export type MintMutationResult =
  | { status: "error"; fieldErrors: MintFieldErrors; formError?: string }
  | { status: "success"; message: string }

export function createMintFieldErrorResult(
  fieldErrors: MintFieldErrors
): MintMutationResult {
  return { status: "error", fieldErrors }
}

export function createMintFormErrorResult(
  formError: string
): MintMutationResult {
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

export function createMintPersistenceError(error: unknown): MintMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_MINT_CODE_CONSTRAINT
    )
  ) {
    return createMintFieldErrorResult({ code: MINT_DUPLICATE_CODE_ERROR })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      MINT_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createMintFormErrorResult(MINT_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_MINT_CODE_CONSTRAINT
    )
  ) {
    return createMintFieldErrorResult({ code: MINT_INVALID_CODE_ERROR })
  }

  return createMintFormErrorResult(MINT_GENERIC_SAVE_ERROR)
}
