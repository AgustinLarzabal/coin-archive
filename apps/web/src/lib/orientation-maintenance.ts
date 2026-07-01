import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const ORIENTATION_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Orientations."
export const ORIENTATION_DUPLICATE_CODE_ERROR =
  "An Orientation with this code already exists."
export const ORIENTATION_GENERIC_SAVE_ERROR = "Unable to save Orientation right now."
export const ORIENTATION_MISSING_ERROR = "Orientation no longer exists."
export const ORIENTATION_IN_USE_DELETE_ERROR =
  "Orientation cannot be deleted while Coins still use it. Remove or reassign the Orientation on those Coins before deleting it."
export const ORIENTATION_INVALID_CODE_ERROR =
  "Orientation Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_ORIENTATION_CODE_CONSTRAINT = "orientation_code_lower_unique_idx"
const INVALID_ORIENTATION_CODE_CONSTRAINT = "orientation_code_slug_check"
const ORIENTATION_IN_USE_DELETE_CONSTRAINT = "coin_orientation_id_orientation_id_fk"
const ORIENTATION_FIELD_NAMES = ["code", "name"] as const

const orientationCodeSchema = z
  .string()
  .trim()
  .min(1, "Orientation Code cannot be blank.")
  .max(255, "Orientation Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, ORIENTATION_INVALID_CODE_ERROR)

const orientationNameSchema = z
  .string()
  .trim()
  .min(1, "Orientation Name cannot be blank.")
  .max(255, "Orientation Name must be 255 characters or fewer.")

export const createOrientationInputSchema = z.object({
  code: orientationCodeSchema,
  name: orientationNameSchema,
})

export const updateOrientationInputSchema = createOrientationInputSchema.extend({
  id: z.uuid(),
})

export const deleteOrientationInputSchema = z.object({
  id: z.uuid(),
})

type OrientationFieldName = (typeof ORIENTATION_FIELD_NAMES)[number]

export type OrientationFieldErrors = Partial<Record<OrientationFieldName, string>>

export type OrientationMutationResult =
  | {
      status: "error"
      fieldErrors: OrientationFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type OrientationAuthorizationErrorResult = {
  status: "error"
  formError: typeof ORIENTATION_AUTHORIZATION_ERROR
}

type CreateOrientationInput = z.input<typeof createOrientationInputSchema>
type CreateOrientationData = z.output<typeof createOrientationInputSchema>
type UpdateOrientationInput = z.input<typeof updateOrientationInputSchema>
type UpdateOrientationData = z.output<typeof updateOrientationInputSchema>
type DeleteOrientationInput = z.input<typeof deleteOrientationInputSchema>
type DeleteOrientationData = z.output<typeof deleteOrientationInputSchema>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: OrientationMutationResult }
type OrientationMutationOperationResult = unknown | null
type SubmitOrientationMutationOptions<TInput, TData> = {
  collector: CollectorWithRole | null
  input: TInput
  dependencies?: OrientationMutationDependencies
  validate: (input: TInput) => ValidationResult<TData>
  execute: (
    dependencies: OrientationMutationDependencies,
    data: TData
  ) => Promise<OrientationMutationOperationResult>
  createSuccessResult: () => OrientationMutationResult
  createNullResult?: () => OrientationMutationResult
}

type OrientationMutationDependencies = {
  createOrientation: (input: CreateOrientationData) => Promise<unknown>
  deleteOrientation: (input: DeleteOrientationData) => Promise<unknown | null>
  updateOrientation: (input: UpdateOrientationData) => Promise<unknown | null>
}

async function getDefaultOrientationMutationDependencies(): Promise<OrientationMutationDependencies> {
  const { createOrientation, deleteOrientation, updateOrientation } = await import("@workspace/db")

  return {
    createOrientation,
    deleteOrientation,
    updateOrientation,
  }
}

async function resolveOrientationMutationDependencies(
  dependencies?: OrientationMutationDependencies
): Promise<OrientationMutationDependencies> {
  return dependencies ?? getDefaultOrientationMutationDependencies()
}

export function createOrientationAuthorizationError(): OrientationAuthorizationErrorResult {
  return {
    status: "error",
    formError: ORIENTATION_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): OrientationMutationResult {
  return {
    ...createOrientationAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(
  fieldErrors: OrientationFieldErrors
): OrientationMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): OrientationMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasOrientationMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isOrientationFieldName(field: unknown): field is OrientationFieldName {
  return (
    typeof field === "string" &&
    ORIENTATION_FIELD_NAMES.includes(field as OrientationFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getOrientationFieldErrors(issues: z.ZodIssue[]): OrientationFieldErrors {
  const fieldErrors: OrientationFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isOrientationFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): OrientationMutationResult {
  return createFieldErrorResult(getOrientationFieldErrors(issues))
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

function createPersistenceError(error: unknown): OrientationMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_ORIENTATION_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
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
    return createFormErrorResult(ORIENTATION_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_ORIENTATION_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: ORIENTATION_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(ORIENTATION_GENERIC_SAVE_ERROR)
}

function validateOrientationInput<TSchema extends z.ZodType>(
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

function validateCreateOrientationInput(
  input: CreateOrientationInput
): ValidationResult<CreateOrientationData> {
  return validateOrientationInput(createOrientationInputSchema, input)
}

function validateUpdateOrientationInput(
  input: UpdateOrientationInput
): ValidationResult<UpdateOrientationData> {
  return validateOrientationInput(updateOrientationInputSchema, input)
}

function validateDeleteOrientationInput(
  input: DeleteOrientationInput
): ValidationResult<DeleteOrientationData> {
  return validateOrientationInput(deleteOrientationInputSchema, input)
}

async function submitOrientationMutation<TInput, TData>({
  collector,
  input,
  dependencies,
  validate,
  execute,
  createSuccessResult,
  createNullResult,
}: SubmitOrientationMutationOptions<TInput, TData>): Promise<OrientationMutationResult> {
  if (!hasOrientationMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validate(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    await resolveOrientationMutationDependencies(dependencies)

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

export async function submitCreateOrientation(
  collector: CollectorWithRole | null,
  input: CreateOrientationInput,
  dependencies?: OrientationMutationDependencies
): Promise<OrientationMutationResult> {
  return submitOrientationMutation({
    collector,
    input,
    dependencies,
    validate: validateCreateOrientationInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.createOrientation(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Orientation added.",
    }),
  })
}

export async function submitUpdateOrientation(
  collector: CollectorWithRole | null,
  input: UpdateOrientationInput,
  dependencies?: OrientationMutationDependencies
): Promise<OrientationMutationResult> {
  return submitOrientationMutation({
    collector,
    input,
    dependencies,
    validate: validateUpdateOrientationInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.updateOrientation(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Saved.",
    }),
    createNullResult: () => createFormErrorResult(ORIENTATION_MISSING_ERROR),
  })
}

export async function submitDeleteOrientation(
  collector: CollectorWithRole | null,
  input: DeleteOrientationInput,
  dependencies?: OrientationMutationDependencies
): Promise<OrientationMutationResult> {
  return submitOrientationMutation({
    collector,
    input,
    dependencies,
    validate: validateDeleteOrientationInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.deleteOrientation(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Orientation deleted.",
    }),
    createNullResult: () => createFormErrorResult(ORIENTATION_MISSING_ERROR),
  })
}
