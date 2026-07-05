import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

export const MINT_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Mints."
export const MINT_DUPLICATE_CODE_ERROR = "A Mint with this code already exists."
export const MINT_GENERIC_SAVE_ERROR = "Unable to save Mint right now."
export const MINT_MISSING_ERROR = "Mint no longer exists."
export const MINT_IN_USE_DELETE_GUIDANCE =
  "Remove or reassign those Coin Mint Attributions before deleting the Mint."
export const MINT_IN_USE_DELETE_ERROR =
  `Mint cannot be deleted while Coin Mint Attributions still use it. ${MINT_IN_USE_DELETE_GUIDANCE}`
export const MINT_INVALID_CODE_ERROR =
  "Mint Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_MINT_CODE_CONSTRAINT = "mint_code_lower_unique_idx"
const INVALID_MINT_CODE_CONSTRAINT = "mint_code_slug_check"
const MINT_IN_USE_DELETE_CONSTRAINT = "coin_mint_mint_id_mint_id_fk"
const MINT_FIELD_NAMES = ["code", "name"] as const

const mintCodeSchema = z
  .string()
  .trim()
  .min(1, "Mint Code cannot be blank.")
  .max(255, "Mint Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, MINT_INVALID_CODE_ERROR)

const mintNameSchema = z
  .string()
  .trim()
  .min(1, "Mint Name cannot be blank.")
  .max(255, "Mint Name must be 255 characters or fewer.")

export const createMintInputSchema = z.object({
  code: mintCodeSchema,
  name: mintNameSchema,
})

export const updateMintInputSchema = createMintInputSchema.extend({
  id: z.uuid(),
})

export const deleteMintInputSchema = z.object({
  id: z.uuid(),
})

type MintFieldName = (typeof MINT_FIELD_NAMES)[number]

export type MintFieldErrors = Partial<Record<MintFieldName, string>>

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

export type MintAuthorizationErrorResult = {
  status: "error"
  formError: typeof MINT_AUTHORIZATION_ERROR
}

type CreateMintInput = z.input<typeof createMintInputSchema>
type CreateMintData = z.output<typeof createMintInputSchema>
type UpdateMintInput = z.input<typeof updateMintInputSchema>
type UpdateMintData = z.output<typeof updateMintInputSchema>
type DeleteMintInput = z.input<typeof deleteMintInputSchema>
type DeleteMintData = z.output<typeof deleteMintInputSchema>

type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: MintMutationResult }

type MintMutationDependencies = {
  createMint: (input: CreateMintData) => Promise<unknown>
  deleteMint: (input: DeleteMintData) => Promise<unknown | null>
  updateMint: (input: UpdateMintData) => Promise<unknown | null>
}

type SubmitMintMutationOptions<TInput, TData> = {
  collector: CollectorWithRole | null
  input: TInput
  dependencies?: MintMutationDependencies
  validate: (input: TInput) => ValidationResult<TData>
  execute: (
    dependencies: MintMutationDependencies,
    data: TData
  ) => Promise<unknown | null>
  createSuccessResult: () => MintMutationResult
  createNullResult?: () => MintMutationResult
}

async function getDefaultMintMutationDependencies(): Promise<MintMutationDependencies> {
  const { createMint, deleteMint, updateMint } = await import("@workspace/db")

  return {
    createMint,
    deleteMint,
    updateMint,
  }
}

async function resolveMintMutationDependencies(
  dependencies?: MintMutationDependencies
): Promise<MintMutationDependencies> {
  return dependencies ?? getDefaultMintMutationDependencies()
}

export function createMintAuthorizationError(): MintAuthorizationErrorResult {
  return {
    status: "error",
    formError: MINT_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): MintMutationResult {
  return {
    ...createMintAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(fieldErrors: MintFieldErrors): MintMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): MintMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasMintMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isMintFieldName(field: unknown): field is MintFieldName {
  return (
    typeof field === "string" && MINT_FIELD_NAMES.includes(field as MintFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getMintFieldErrors(issues: z.ZodIssue[]): MintFieldErrors {
  const fieldErrors: MintFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isMintFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): MintMutationResult {
  return createFieldErrorResult(getMintFieldErrors(issues))
}

function getPostgresError(error: unknown) {
  if (!isObjectRecord(error)) {
    return null
  }

  const postgresError = "cause" in error ? error.cause : error

  if (!isObjectRecord(postgresError)) {
    return null
  }

  return postgresError
}

function matchesPostgresConstraint(
  error: unknown,
  code: string,
  constraintName: string
) {
  const postgresError = getPostgresError(error)

  return (
    postgresError !== null &&
    "code" in postgresError &&
    postgresError.code === code &&
    "constraint_name" in postgresError &&
    postgresError.constraint_name === constraintName
  )
}

function createPersistenceError(error: unknown): MintMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_MINT_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: MINT_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      MINT_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createFormErrorResult(MINT_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_MINT_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: MINT_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(MINT_GENERIC_SAVE_ERROR)
}

function validateMintInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
): ValidationResult<z.output<TSchema>> {
  const parsedInput = schema.safeParse(input)

  if (!parsedInput.success) {
    return {
      success: false,
      result: createValidationError(parsedInput.error.issues),
    }
  }

  return {
    success: true,
    data: parsedInput.data,
  }
}

function validateCreateMintInput(
  input: CreateMintInput
): ValidationResult<CreateMintData> {
  return validateMintInput(createMintInputSchema, input)
}

function validateUpdateMintInput(
  input: UpdateMintInput
): ValidationResult<UpdateMintData> {
  return validateMintInput(updateMintInputSchema, input)
}

function validateDeleteMintInput(
  input: DeleteMintInput
): ValidationResult<DeleteMintData> {
  return validateMintInput(deleteMintInputSchema, input)
}

async function submitMintMutation<TInput, TData>({
  collector,
  input,
  dependencies,
  validate,
  execute,
  createSuccessResult,
  createNullResult,
}: SubmitMintMutationOptions<TInput, TData>): Promise<MintMutationResult> {
  if (!hasMintMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validate(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies = await resolveMintMutationDependencies(dependencies)

  try {
    const result = await execute(resolvedDependencies, validationResult.data)

    if (result === null) {
      return createNullResult
        ? createNullResult()
        : createFormErrorResult(MINT_MISSING_ERROR)
    }

    return createSuccessResult()
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitCreateMint(
  collector: CollectorWithRole | null,
  input: CreateMintInput,
  dependencies?: MintMutationDependencies
): Promise<MintMutationResult> {
  return submitMintMutation({
    collector,
    input,
    dependencies,
    validate: validateCreateMintInput,
    execute: (resolvedDependencies, data) => resolvedDependencies.createMint(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Mint added.",
    }),
  })
}

export async function submitUpdateMint(
  collector: CollectorWithRole | null,
  input: UpdateMintInput,
  dependencies?: MintMutationDependencies
): Promise<MintMutationResult> {
  return submitMintMutation({
    collector,
    input,
    dependencies,
    validate: validateUpdateMintInput,
    execute: (resolvedDependencies, data) => resolvedDependencies.updateMint(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Saved.",
    }),
  })
}

export async function submitDeleteMint(
  collector: CollectorWithRole | null,
  input: DeleteMintInput,
  dependencies?: MintMutationDependencies
): Promise<MintMutationResult> {
  return submitMintMutation({
    collector,
    input,
    dependencies,
    validate: validateDeleteMintInput,
    execute: (resolvedDependencies, data) => resolvedDependencies.deleteMint(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Mint deleted.",
    }),
  })
}
