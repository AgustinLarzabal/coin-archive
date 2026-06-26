import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const ENGRAVER_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Engravers."
export const ENGRAVER_DUPLICATE_CODE_ERROR =
  "An Engraver with this code already exists."
export const ENGRAVER_GENERIC_SAVE_ERROR =
  "Unable to save Engraver right now."
export const ENGRAVER_MISSING_ERROR = "Engraver no longer exists."
export const ENGRAVER_IN_USE_DELETE_ERROR =
  "Engraver cannot be deleted while Engraver Attributions still use it. Remove those Engraver Attributions before deleting the Engraver."
export const ENGRAVER_INVALID_CODE_ERROR =
  "Engraver Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_ENGRAVER_CODE_CONSTRAINT = "engraver_code_lower_unique_idx"
const INVALID_ENGRAVER_CODE_CONSTRAINT = "engraver_code_slug_check"
const ENGRAVER_IN_USE_DELETE_CONSTRAINT = "coin_face_engraver_engraver_id_fkey"
const ENGRAVER_FIELD_NAMES = ["code", "name"] as const

const engraverCodeSchema = z
  .string()
  .trim()
  .min(1, "Engraver Code cannot be blank.")
  .max(255, "Engraver Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, ENGRAVER_INVALID_CODE_ERROR)

const engraverNameSchema = z
  .string()
  .trim()
  .min(1, "Engraver Name cannot be blank.")
  .max(255, "Engraver Name must be 255 characters or fewer.")

export const createEngraverInputSchema = z.object({
  code: engraverCodeSchema,
  name: engraverNameSchema,
})

export const updateEngraverInputSchema = createEngraverInputSchema.extend({
  id: z.uuid(),
})

export const deleteEngraverInputSchema = z.object({
  id: z.uuid(),
})

type EngraverFieldName = (typeof ENGRAVER_FIELD_NAMES)[number]

export type EngraverFieldErrors = Partial<Record<EngraverFieldName, string>>

export type EngraverMutationResult =
  | {
      status: "error"
      fieldErrors: EngraverFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type EngraverAuthorizationErrorResult = {
  status: "error"
  formError: typeof ENGRAVER_AUTHORIZATION_ERROR
}

type CreateEngraverInput = z.input<typeof createEngraverInputSchema>
type CreateEngraverData = z.output<typeof createEngraverInputSchema>
type UpdateEngraverInput = z.input<typeof updateEngraverInputSchema>
type UpdateEngraverData = z.output<typeof updateEngraverInputSchema>
type DeleteEngraverInput = z.input<typeof deleteEngraverInputSchema>
type DeleteEngraverData = z.output<typeof deleteEngraverInputSchema>

type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: EngraverMutationResult }

type SubmitEngraverMutationOptions<TInput, TData> = {
  collector: CollectorWithRole | null
  input: TInput
  dependencies?: EngraverMutationDependencies
  validate: (input: TInput) => ValidationResult<TData>
  execute: (
    dependencies: EngraverMutationDependencies,
    data: TData
  ) => Promise<unknown | null>
  createSuccessResult: () => EngraverMutationResult
  createNullResult?: () => EngraverMutationResult
}

type EngraverMutationDependencies = {
  createEngraver: (input: CreateEngraverData) => Promise<unknown>
  deleteEngraver: (input: DeleteEngraverData) => Promise<unknown | null>
  updateEngraver: (input: UpdateEngraverData) => Promise<unknown | null>
}

async function getDefaultEngraverMutationDependencies(): Promise<EngraverMutationDependencies> {
  const { createEngraver, deleteEngraver, updateEngraver } =
    await import("@workspace/db")

  return {
    createEngraver,
    deleteEngraver,
    updateEngraver,
  }
}

async function resolveEngraverMutationDependencies(
  dependencies?: EngraverMutationDependencies
): Promise<EngraverMutationDependencies> {
  return dependencies ?? getDefaultEngraverMutationDependencies()
}

export function createEngraverAuthorizationError(): EngraverAuthorizationErrorResult {
  return {
    status: "error",
    formError: ENGRAVER_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): EngraverMutationResult {
  return createFormErrorResult(ENGRAVER_AUTHORIZATION_ERROR)
}

function createFieldErrorResult(
  fieldErrors: EngraverFieldErrors
): EngraverMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): EngraverMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasEngraverMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isEngraverFieldName(field: unknown): field is EngraverFieldName {
  return (
    typeof field === "string" &&
    ENGRAVER_FIELD_NAMES.includes(field as EngraverFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getEngraverFieldErrors(
  issues: z.ZodIssue[]
): EngraverFieldErrors {
  const fieldErrors: EngraverFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isEngraverFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): EngraverMutationResult {
  return createFieldErrorResult(getEngraverFieldErrors(issues))
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

function createPersistenceError(error: unknown): EngraverMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_ENGRAVER_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: ENGRAVER_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      ENGRAVER_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createFormErrorResult(ENGRAVER_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_ENGRAVER_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: ENGRAVER_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(ENGRAVER_GENERIC_SAVE_ERROR)
}

function validateEngraverInput<TSchema extends z.ZodType>(
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

function validateCreateEngraverInput(
  input: CreateEngraverInput
): ValidationResult<CreateEngraverData> {
  return validateEngraverInput(createEngraverInputSchema, input)
}

function validateUpdateEngraverInput(
  input: UpdateEngraverInput
): ValidationResult<UpdateEngraverData> {
  return validateEngraverInput(updateEngraverInputSchema, input)
}

function validateDeleteEngraverInput(
  input: DeleteEngraverInput
): ValidationResult<DeleteEngraverData> {
  return validateEngraverInput(deleteEngraverInputSchema, input)
}

async function submitEngraverMutation<TInput, TData>({
  collector,
  input,
  dependencies,
  validate,
  execute,
  createSuccessResult,
  createNullResult,
}: SubmitEngraverMutationOptions<TInput, TData>): Promise<EngraverMutationResult> {
  if (!hasEngraverMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validate(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies = await resolveEngraverMutationDependencies(
    dependencies
  )

  try {
    const result = await execute(resolvedDependencies, validationResult.data)

    if (result === null) {
      return createNullResult
        ? createNullResult()
        : createFormErrorResult(ENGRAVER_MISSING_ERROR)
    }

    return createSuccessResult()
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitCreateEngraver(
  collector: CollectorWithRole | null,
  input: CreateEngraverInput,
  dependencies?: EngraverMutationDependencies
): Promise<EngraverMutationResult> {
  return submitEngraverMutation({
    collector,
    input,
    dependencies,
    validate: validateCreateEngraverInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.createEngraver(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Engraver added.",
    }),
  })
}

export async function submitUpdateEngraver(
  collector: CollectorWithRole | null,
  input: UpdateEngraverInput,
  dependencies?: EngraverMutationDependencies
): Promise<EngraverMutationResult> {
  return submitEngraverMutation({
    collector,
    input,
    dependencies,
    validate: validateUpdateEngraverInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.updateEngraver(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Saved.",
    }),
  })
}

export async function submitDeleteEngraver(
  collector: CollectorWithRole | null,
  input: DeleteEngraverInput,
  dependencies?: EngraverMutationDependencies
): Promise<EngraverMutationResult> {
  return submitEngraverMutation({
    collector,
    input,
    dependencies,
    validate: validateDeleteEngraverInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.deleteEngraver(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Engraver deleted.",
    }),
  })
}
