import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

export const MINTING_TECHNIQUE_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Minting Techniques."
export const MINTING_TECHNIQUE_DUPLICATE_CODE_ERROR =
  "A Minting Technique with this code already exists."
export const MINTING_TECHNIQUE_GENERIC_SAVE_ERROR =
  "Unable to save Minting Technique right now."
export const MINTING_TECHNIQUE_MISSING_ERROR =
  "Minting Technique no longer exists."
export const MINTING_TECHNIQUE_IN_USE_DELETE_GUIDANCE =
  "Remove or reassign the Minting Technique on those Coins before deleting it."
export const MINTING_TECHNIQUE_IN_USE_DELETE_ERROR =
  `Minting Technique cannot be deleted while Coins still use it. ${MINTING_TECHNIQUE_IN_USE_DELETE_GUIDANCE}`
export const MINTING_TECHNIQUE_INVALID_CODE_ERROR =
  "Minting Technique Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_MINTING_TECHNIQUE_CODE_CONSTRAINT =
  "technique_code_lower_unique_idx"
const INVALID_MINTING_TECHNIQUE_CODE_CONSTRAINT =
  "technique_code_slug_check"
const MINTING_TECHNIQUE_IN_USE_DELETE_CONSTRAINT =
  "coin_technique_id_technique_id_fk"
const MINTING_TECHNIQUE_FIELD_NAMES = ["code", "name"] as const

const mintingTechniqueCodeSchema = z
  .string()
  .trim()
  .min(1, "Minting Technique Code cannot be blank.")
  .max(255, "Minting Technique Code must be 255 characters or fewer.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    MINTING_TECHNIQUE_INVALID_CODE_ERROR
  )

const mintingTechniqueNameSchema = z
  .string()
  .trim()
  .min(1, "Minting Technique Name cannot be blank.")
  .max(255, "Minting Technique Name must be 255 characters or fewer.")

export const createMintingTechniqueInputSchema = z.object({
  code: mintingTechniqueCodeSchema,
  name: mintingTechniqueNameSchema,
})

export const updateMintingTechniqueInputSchema =
  createMintingTechniqueInputSchema.extend({
    id: z.uuid(),
  })

export const deleteMintingTechniqueInputSchema = z.object({
  id: z.uuid(),
})

type MintingTechniqueFieldName =
  (typeof MINTING_TECHNIQUE_FIELD_NAMES)[number]

export type MintingTechniqueFieldErrors = Partial<
  Record<MintingTechniqueFieldName, string>
>

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

export type MintingTechniqueAuthorizationErrorResult = {
  status: "error"
  formError: typeof MINTING_TECHNIQUE_AUTHORIZATION_ERROR
}

type CreateMintingTechniqueInput = z.input<
  typeof createMintingTechniqueInputSchema
>
type CreateMintingTechniqueData = z.output<
  typeof createMintingTechniqueInputSchema
>
type UpdateMintingTechniqueInput = z.input<
  typeof updateMintingTechniqueInputSchema
>
type UpdateMintingTechniqueData = z.output<
  typeof updateMintingTechniqueInputSchema
>
type DeleteMintingTechniqueInput = z.input<
  typeof deleteMintingTechniqueInputSchema
>
type DeleteMintingTechniqueData = z.output<
  typeof deleteMintingTechniqueInputSchema
>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: MintingTechniqueMutationResult }
type MintingTechniqueMutationExecutor<TData> = (
  dependencies: MintingTechniqueMutationDependencies,
  data: TData
) => Promise<unknown | null>
type SubmitMintingTechniqueMutationOptions<TInput, TData> = {
  collector: CollectorWithRole | null
  input: TInput
  dependencies?: MintingTechniqueMutationDependencies
  validate: (input: TInput) => ValidationResult<TData>
  runMutation: MintingTechniqueMutationExecutor<TData>
  createSuccessResult: () => MintingTechniqueMutationResult
  createMissingResult?: () => MintingTechniqueMutationResult
}

type MintingTechniqueMutationDependencies = {
  createTechnique: (input: CreateMintingTechniqueData) => Promise<unknown>
  deleteTechnique: (
    input: DeleteMintingTechniqueData
  ) => Promise<unknown | null>
  updateTechnique: (
    input: UpdateMintingTechniqueData
  ) => Promise<unknown | null>
}

async function getDefaultMintingTechniqueMutationDependencies(): Promise<MintingTechniqueMutationDependencies> {
  const { createTechnique, deleteTechnique, updateTechnique } =
    await import("@workspace/db")

  return {
    createTechnique,
    deleteTechnique,
    updateTechnique,
  }
}

async function resolveMintingTechniqueMutationDependencies(
  dependencies?: MintingTechniqueMutationDependencies
): Promise<MintingTechniqueMutationDependencies> {
  return dependencies ?? getDefaultMintingTechniqueMutationDependencies()
}

export function createMintingTechniqueAuthorizationError(): MintingTechniqueAuthorizationErrorResult {
  return {
    status: "error",
    formError: MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): MintingTechniqueMutationResult {
  return {
    ...createMintingTechniqueAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(
  fieldErrors: MintingTechniqueFieldErrors
): MintingTechniqueMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(
  formError: string
): MintingTechniqueMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasMintingTechniqueMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isMintingTechniqueFieldName(
  field: unknown
): field is MintingTechniqueFieldName {
  return (
    typeof field === "string" &&
    MINTING_TECHNIQUE_FIELD_NAMES.includes(
      field as MintingTechniqueFieldName
    )
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getMintingTechniqueFieldErrors(
  issues: z.ZodIssue[]
): MintingTechniqueFieldErrors {
  const fieldErrors: MintingTechniqueFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isMintingTechniqueFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(
  issues: z.ZodIssue[]
): MintingTechniqueMutationResult {
  return createFieldErrorResult(getMintingTechniqueFieldErrors(issues))
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

type PostgresConstraintError = {
  code: string
  constraint_name: string
}

function isPostgresConstraintError(
  value: unknown
): value is PostgresConstraintError {
  return (
    isObjectRecord(value) &&
    typeof value.code === "string" &&
    typeof value.constraint_name === "string"
  )
}

function matchesPostgresConstraint(
  error: unknown,
  code: string,
  constraintName: string
) {
  const postgresError = getPostgresError(error)

  return (
    isPostgresConstraintError(postgresError) &&
    postgresError.code === code &&
    postgresError.constraint_name === constraintName
  )
}

function createPersistenceError(
  error: unknown
): MintingTechniqueMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_MINTING_TECHNIQUE_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: MINTING_TECHNIQUE_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      MINTING_TECHNIQUE_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createFormErrorResult(MINTING_TECHNIQUE_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_MINTING_TECHNIQUE_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: MINTING_TECHNIQUE_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(MINTING_TECHNIQUE_GENERIC_SAVE_ERROR)
}

function validateMintingTechniqueInput<TSchema extends z.ZodType>(
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

function validateCreateMintingTechniqueInput(
  input: CreateMintingTechniqueInput
): ValidationResult<CreateMintingTechniqueData> {
  return validateMintingTechniqueInput(createMintingTechniqueInputSchema, input)
}

function validateUpdateMintingTechniqueInput(
  input: UpdateMintingTechniqueInput
): ValidationResult<UpdateMintingTechniqueData> {
  return validateMintingTechniqueInput(updateMintingTechniqueInputSchema, input)
}

function validateDeleteMintingTechniqueInput(
  input: DeleteMintingTechniqueInput
): ValidationResult<DeleteMintingTechniqueData> {
  return validateMintingTechniqueInput(deleteMintingTechniqueInputSchema, input)
}

async function submitMintingTechniqueMutation<TInput, TData>({
  collector,
  input,
  dependencies,
  validate,
  runMutation,
  createSuccessResult,
  createMissingResult,
}: SubmitMintingTechniqueMutationOptions<
  TInput,
  TData
>): Promise<MintingTechniqueMutationResult> {
  if (!hasMintingTechniqueMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validate(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    await resolveMintingTechniqueMutationDependencies(dependencies)

  try {
    const mutationResult = await runMutation(
      resolvedDependencies,
      validationResult.data
    )

    if (mutationResult === null && createMissingResult) {
      return createMissingResult()
    }

    return createSuccessResult()
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitCreateMintingTechnique(
  collector: CollectorWithRole | null,
  input: CreateMintingTechniqueInput,
  dependencies?: MintingTechniqueMutationDependencies
): Promise<MintingTechniqueMutationResult> {
  return submitMintingTechniqueMutation({
    collector,
    input,
    dependencies,
    validate: validateCreateMintingTechniqueInput,
    runMutation: (resolvedDependencies, data) =>
      resolvedDependencies.createTechnique(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Minting Technique added.",
    }),
  })
}

export async function submitUpdateMintingTechnique(
  collector: CollectorWithRole | null,
  input: UpdateMintingTechniqueInput,
  dependencies?: MintingTechniqueMutationDependencies
): Promise<MintingTechniqueMutationResult> {
  return submitMintingTechniqueMutation({
    collector,
    input,
    dependencies,
    validate: validateUpdateMintingTechniqueInput,
    runMutation: (resolvedDependencies, data) =>
      resolvedDependencies.updateTechnique(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Saved.",
    }),
    createMissingResult: () =>
      createFormErrorResult(MINTING_TECHNIQUE_MISSING_ERROR),
  })
}

export async function submitDeleteMintingTechnique(
  collector: CollectorWithRole | null,
  input: DeleteMintingTechniqueInput,
  dependencies?: MintingTechniqueMutationDependencies
): Promise<MintingTechniqueMutationResult> {
  return submitMintingTechniqueMutation({
    collector,
    input,
    dependencies,
    validate: validateDeleteMintingTechniqueInput,
    runMutation: (resolvedDependencies, data) =>
      resolvedDependencies.deleteTechnique(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Minting Technique deleted.",
    }),
    createMissingResult: () =>
      createFormErrorResult(MINTING_TECHNIQUE_MISSING_ERROR),
  })
}
