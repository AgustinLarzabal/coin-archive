import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const RIM_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Rims."
export const RIM_DUPLICATE_CODE_ERROR = "A Rim with this code already exists."
export const RIM_GENERIC_SAVE_ERROR = "Unable to save Rim right now."
export const RIM_MISSING_ERROR = "Rim no longer exists."
export const RIM_DELETE_REASSIGN_REQUIRED_MESSAGE =
  "Remove or reassign the Rim on those Coins before deleting it."
export const RIM_DELETE_EXISTING_COINS_REASSIGN_REQUIRED_MESSAGE =
  RIM_DELETE_REASSIGN_REQUIRED_MESSAGE.replace("those Coins", "existing Coins")
export const RIM_IN_USE_DELETE_ERROR =
  `Rim cannot be deleted while Coins still use it. ${RIM_DELETE_REASSIGN_REQUIRED_MESSAGE}`
export const RIM_INVALID_CODE_ERROR =
  "Rim Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_RIM_CODE_CONSTRAINT = "rim_code_lower_unique_idx"
const INVALID_RIM_CODE_CONSTRAINT = "rim_code_slug_check"
const RIM_IN_USE_DELETE_CONSTRAINT = "coin_rim_id_rim_id_fk"
const RIM_FIELD_NAMES = ["code", "name"] as const

const rimCodeSchema = z
  .string()
  .trim()
  .min(1, "Rim Code cannot be blank.")
  .max(255, "Rim Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, RIM_INVALID_CODE_ERROR)

const rimNameSchema = z
  .string()
  .trim()
  .min(1, "Rim Name cannot be blank.")
  .max(255, "Rim Name must be 255 characters or fewer.")

export const createRimInputSchema = z.object({
  code: rimCodeSchema,
  name: rimNameSchema,
})

export const updateRimInputSchema = createRimInputSchema.extend({
  id: z.uuid(),
})

export const deleteRimInputSchema = z.object({
  id: z.uuid(),
})

type RimFieldName = (typeof RIM_FIELD_NAMES)[number]

export type RimFieldErrors = Partial<Record<RimFieldName, string>>

export type RimMutationResult =
  | {
      status: "error"
      fieldErrors: RimFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type RimAuthorizationErrorResult = {
  status: "error"
  formError: typeof RIM_AUTHORIZATION_ERROR
}

type CreateRimInput = z.input<typeof createRimInputSchema>
type CreateRimData = z.output<typeof createRimInputSchema>
type UpdateRimInput = z.input<typeof updateRimInputSchema>
type UpdateRimData = z.output<typeof updateRimInputSchema>
type DeleteRimInput = z.input<typeof deleteRimInputSchema>
type DeleteRimData = z.output<typeof deleteRimInputSchema>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: RimMutationResult }
type RimMutationOperationResult = unknown | null
type SubmitRimMutationOptions<TInput, TData> = {
  collector: CollectorWithRole | null
  input: TInput
  dependencies?: RimMutationDependencies
  validate: (input: TInput) => ValidationResult<TData>
  execute: (
    dependencies: RimMutationDependencies,
    data: TData
  ) => Promise<RimMutationOperationResult>
  createSuccessResult: () => RimMutationResult
  createNullResult?: () => RimMutationResult
}

type RimMutationDependencies = {
  createRim: (input: CreateRimData) => Promise<unknown>
  deleteRim: (input: DeleteRimData) => Promise<unknown | null>
  updateRim: (input: UpdateRimData) => Promise<unknown | null>
}

async function getDefaultRimMutationDependencies(): Promise<RimMutationDependencies> {
  const { createRim, deleteRim, updateRim } = await import("@workspace/db")

  return {
    createRim,
    deleteRim,
    updateRim,
  }
}

async function resolveRimMutationDependencies(
  dependencies?: RimMutationDependencies
): Promise<RimMutationDependencies> {
  return dependencies ?? getDefaultRimMutationDependencies()
}

export function createRimAuthorizationError(): RimAuthorizationErrorResult {
  return {
    status: "error",
    formError: RIM_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): RimMutationResult {
  return {
    ...createRimAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(fieldErrors: RimFieldErrors): RimMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): RimMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasRimMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isRimFieldName(field: unknown): field is RimFieldName {
  return (
    typeof field === "string" &&
    RIM_FIELD_NAMES.includes(field as RimFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getRimFieldErrors(issues: z.ZodIssue[]): RimFieldErrors {
  const fieldErrors: RimFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isRimFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): RimMutationResult {
  return createFieldErrorResult(getRimFieldErrors(issues))
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

function createPersistenceError(error: unknown): RimMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_RIM_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: RIM_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      RIM_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createFormErrorResult(RIM_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_RIM_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: RIM_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(RIM_GENERIC_SAVE_ERROR)
}

function validateRimInput<TSchema extends z.ZodType>(
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

function validateCreateRimInput(
  input: CreateRimInput
): ValidationResult<CreateRimData> {
  return validateRimInput(createRimInputSchema, input)
}

function validateUpdateRimInput(
  input: UpdateRimInput
): ValidationResult<UpdateRimData> {
  return validateRimInput(updateRimInputSchema, input)
}

function validateDeleteRimInput(
  input: DeleteRimInput
): ValidationResult<DeleteRimData> {
  return validateRimInput(deleteRimInputSchema, input)
}

async function submitRimMutation<TInput, TData>({
  collector,
  input,
  dependencies,
  validate,
  execute,
  createSuccessResult,
  createNullResult,
}: SubmitRimMutationOptions<TInput, TData>): Promise<RimMutationResult> {
  if (!hasRimMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validate(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies = await resolveRimMutationDependencies(dependencies)

  try {
    const mutationResult = await execute(
      resolvedDependencies,
      validationResult.data
    )

    if (mutationResult === null && createNullResult) {
      return createNullResult()
    }

    return createSuccessResult()
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitCreateRim(
  collector: CollectorWithRole | null,
  input: CreateRimInput,
  dependencies?: RimMutationDependencies
): Promise<RimMutationResult> {
  return submitRimMutation({
    collector,
    input,
    dependencies,
    validate: validateCreateRimInput,
    execute: (resolvedDependencies, data) => resolvedDependencies.createRim(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Rim added.",
    }),
  })
}

export async function submitUpdateRim(
  collector: CollectorWithRole | null,
  input: UpdateRimInput,
  dependencies?: RimMutationDependencies
): Promise<RimMutationResult> {
  return submitRimMutation({
    collector,
    input,
    dependencies,
    validate: validateUpdateRimInput,
    execute: (resolvedDependencies, data) => resolvedDependencies.updateRim(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Saved.",
    }),
    createNullResult: () => createFormErrorResult(RIM_MISSING_ERROR),
  })
}

export async function submitDeleteRim(
  collector: CollectorWithRole | null,
  input: DeleteRimInput,
  dependencies?: RimMutationDependencies
): Promise<RimMutationResult> {
  return submitRimMutation({
    collector,
    input,
    dependencies,
    validate: validateDeleteRimInput,
    execute: (resolvedDependencies, data) => resolvedDependencies.deleteRim(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Rim deleted.",
    }),
    createNullResult: () => createFormErrorResult(RIM_MISSING_ERROR),
  })
}
