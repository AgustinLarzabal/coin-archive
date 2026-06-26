import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const DISTRIBUTION_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Distributions."
export const DISTRIBUTION_DUPLICATE_CODE_ERROR =
  "A Distribution with this code already exists."
export const DISTRIBUTION_GENERIC_SAVE_ERROR =
  "Unable to save Distribution right now."
export const DISTRIBUTION_MISSING_ERROR = "Distribution no longer exists."
export const DISTRIBUTION_INVALID_CODE_ERROR =
  "Distribution Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const DUPLICATE_DISTRIBUTION_CODE_CONSTRAINT =
  "distribution_code_lower_unique_idx"
const INVALID_DISTRIBUTION_CODE_CONSTRAINT = "distribution_code_slug_check"
const DISTRIBUTION_FIELD_NAMES = ["code", "name"] as const

const distributionCodeSchema = z
  .string()
  .trim()
  .min(1, "Distribution Code cannot be blank.")
  .max(255, "Distribution Code must be 255 characters or fewer.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    DISTRIBUTION_INVALID_CODE_ERROR
  )

const distributionNameSchema = z
  .string()
  .trim()
  .min(1, "Distribution Name cannot be blank.")
  .max(255, "Distribution Name must be 255 characters or fewer.")

export const createDistributionInputSchema = z.object({
  code: distributionCodeSchema,
  name: distributionNameSchema,
})

export const updateDistributionInputSchema = createDistributionInputSchema.extend({
  id: z.uuid(),
})

type DistributionFieldName = (typeof DISTRIBUTION_FIELD_NAMES)[number]

export type DistributionFieldErrors = Partial<
  Record<DistributionFieldName, string>
>

export type DistributionMutationResult =
  | {
      status: "error"
      fieldErrors: DistributionFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type DistributionAuthorizationErrorResult = {
  status: "error"
  formError: typeof DISTRIBUTION_AUTHORIZATION_ERROR
}

type CreateDistributionInput = z.input<typeof createDistributionInputSchema>
type CreateDistributionData = z.output<typeof createDistributionInputSchema>
type UpdateDistributionInput = z.input<typeof updateDistributionInputSchema>
type UpdateDistributionData = z.output<typeof updateDistributionInputSchema>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: DistributionMutationResult }

type DistributionMutationDependencies = {
  createDistribution: (input: CreateDistributionData) => Promise<unknown>
  updateDistribution: (
    input: UpdateDistributionData
  ) => Promise<unknown | null>
}

async function getDefaultDistributionMutationDependencies(): Promise<DistributionMutationDependencies> {
  const { createDistribution, updateDistribution } = await import("@workspace/db")

  return {
    createDistribution,
    updateDistribution,
  }
}

export function createDistributionAuthorizationError(): DistributionAuthorizationErrorResult {
  return {
    status: "error",
    formError: DISTRIBUTION_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): DistributionMutationResult {
  return {
    ...createDistributionAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(
  fieldErrors: DistributionFieldErrors
): DistributionMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(
  formError: string
): DistributionMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasDistributionMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isDistributionFieldName(
  field: unknown
): field is DistributionFieldName {
  return (
    typeof field === "string" &&
    DISTRIBUTION_FIELD_NAMES.includes(field as DistributionFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getDistributionFieldErrors(
  issues: z.ZodIssue[]
): DistributionFieldErrors {
  const fieldErrors: DistributionFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isDistributionFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(
  issues: z.ZodIssue[]
): DistributionMutationResult {
  return createFieldErrorResult(getDistributionFieldErrors(issues))
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

function createPersistenceError(error: unknown): DistributionMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_DISTRIBUTION_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: DISTRIBUTION_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_DISTRIBUTION_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: DISTRIBUTION_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(DISTRIBUTION_GENERIC_SAVE_ERROR)
}

function validateDistributionInput<TSchema extends z.ZodType>(
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

function validateCreateDistributionInput(
  input: CreateDistributionInput
): ValidationResult<CreateDistributionData> {
  return validateDistributionInput(createDistributionInputSchema, input)
}

function validateUpdateDistributionInput(
  input: UpdateDistributionInput
): ValidationResult<UpdateDistributionData> {
  return validateDistributionInput(updateDistributionInputSchema, input)
}

export async function submitCreateDistribution(
  collector: CollectorWithRole | null,
  input: CreateDistributionInput,
  dependencies?: DistributionMutationDependencies
): Promise<DistributionMutationResult> {
  if (!hasDistributionMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateCreateDistributionInput(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultDistributionMutationDependencies())

  try {
    await resolvedDependencies.createDistribution(validationResult.data)

    return {
      status: "success",
      message: "Distribution added.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitUpdateDistribution(
  collector: CollectorWithRole | null,
  input: UpdateDistributionInput,
  dependencies?: DistributionMutationDependencies
): Promise<DistributionMutationResult> {
  if (!hasDistributionMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateUpdateDistributionInput(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultDistributionMutationDependencies())

  try {
    const updatedDistribution = await resolvedDependencies.updateDistribution(
      validationResult.data
    )

    if (updatedDistribution === null) {
      return createFormErrorResult(DISTRIBUTION_MISSING_ERROR)
    }

    return {
      status: "success",
      message: "Saved.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}
