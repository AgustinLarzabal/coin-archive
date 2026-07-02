import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const THEME_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Themes."
export const THEME_DUPLICATE_CODE_ERROR =
  "A Theme with this code already exists."
export const THEME_GENERIC_SAVE_ERROR = "Unable to save Theme right now."
export const THEME_MISSING_ERROR = "Theme no longer exists."
export const THEME_IN_USE_DELETE_GUIDANCE =
  "Remove or reassign Theme Attributions on those Coins before deleting it."
export const THEME_IN_USE_DELETE_ERROR =
  `Theme cannot be deleted while Coins still use it. ${THEME_IN_USE_DELETE_GUIDANCE}`
export const THEME_INVALID_CODE_ERROR =
  "Theme Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_THEME_CODE_CONSTRAINT = "theme_code_lower_unique_idx"
const INVALID_THEME_CODE_CONSTRAINT = "theme_code_slug_check"
const THEME_IN_USE_DELETE_CONSTRAINT = "coin_theme_theme_id_theme_id_fk"
const THEME_FIELD_NAMES = ["code", "name"] as const

const themeCodeSchema = z
  .string()
  .trim()
  .min(1, "Theme Code cannot be blank.")
  .max(255, "Theme Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, THEME_INVALID_CODE_ERROR)

const themeNameSchema = z
  .string()
  .trim()
  .min(1, "Theme Name cannot be blank.")
  .max(255, "Theme Name must be 255 characters or fewer.")

export const createThemeInputSchema = z.object({
  code: themeCodeSchema,
  name: themeNameSchema,
})

export const updateThemeInputSchema = createThemeInputSchema.extend({
  id: z.uuid(),
})

export const deleteThemeInputSchema = z.object({
  id: z.uuid(),
})

type ThemeFieldName = (typeof THEME_FIELD_NAMES)[number]

export type ThemeFieldErrors = Partial<Record<ThemeFieldName, string>>

export type ThemeMutationResult =
  | {
      status: "error"
      fieldErrors: ThemeFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type ThemeAuthorizationErrorResult = {
  status: "error"
  formError: typeof THEME_AUTHORIZATION_ERROR
}

type CreateThemeInput = z.input<typeof createThemeInputSchema>
type CreateThemeData = z.output<typeof createThemeInputSchema>
type UpdateThemeInput = z.input<typeof updateThemeInputSchema>
type UpdateThemeData = z.output<typeof updateThemeInputSchema>
type DeleteThemeInput = z.input<typeof deleteThemeInputSchema>
type DeleteThemeData = z.output<typeof deleteThemeInputSchema>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: ThemeMutationResult }
type ThemeMutationRunner<TData> = (
  dependencies: ThemeMutationDependencies,
  data: TData
) => Promise<unknown | null>
type SubmitThemeMutationOptions<TInput, TData> = {
  collector: CollectorWithRole | null
  input: TInput
  dependencies?: ThemeMutationDependencies
  validate: (input: TInput) => ValidationResult<TData>
  run: ThemeMutationRunner<TData>
  successResult: ThemeMutationResult
  missingResult?: ThemeMutationResult
}

type ThemeMutationDependencies = {
  createTheme: (input: CreateThemeData) => Promise<unknown>
  deleteTheme: (input: DeleteThemeData) => Promise<unknown | null>
  updateTheme: (input: UpdateThemeData) => Promise<unknown | null>
}

async function getDefaultThemeMutationDependencies(): Promise<ThemeMutationDependencies> {
  const { createTheme, deleteTheme, updateTheme } =
    await import("@workspace/db")

  return {
    createTheme,
    deleteTheme,
    updateTheme,
  }
}

async function resolveThemeMutationDependencies(
  dependencies?: ThemeMutationDependencies
): Promise<ThemeMutationDependencies> {
  return dependencies ?? getDefaultThemeMutationDependencies()
}

const THEME_CREATE_SUCCESS_RESULT = {
  status: "success",
  message: "Theme added.",
} satisfies ThemeMutationResult

const THEME_UPDATE_SUCCESS_RESULT = {
  status: "success",
  message: "Saved.",
} satisfies ThemeMutationResult

const THEME_DELETE_SUCCESS_RESULT = {
  status: "success",
  message: "Theme deleted.",
} satisfies ThemeMutationResult

export function createThemeAuthorizationError(): ThemeAuthorizationErrorResult {
  return {
    status: "error",
    formError: THEME_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): ThemeMutationResult {
  return {
    ...createThemeAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(
  fieldErrors: ThemeFieldErrors
): ThemeMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): ThemeMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasThemeMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isThemeFieldName(field: unknown): field is ThemeFieldName {
  return (
    typeof field === "string" &&
    THEME_FIELD_NAMES.includes(field as ThemeFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getThemeFieldErrors(issues: z.ZodIssue[]): ThemeFieldErrors {
  const fieldErrors: ThemeFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isThemeFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): ThemeMutationResult {
  return createFieldErrorResult(getThemeFieldErrors(issues))
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

function createPersistenceError(error: unknown): ThemeMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_THEME_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: THEME_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      THEME_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createFormErrorResult(THEME_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_THEME_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: THEME_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(THEME_GENERIC_SAVE_ERROR)
}

function validateThemeInput<TSchema extends z.ZodType>(
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

function validateCreateThemeInput(
  input: CreateThemeInput
): ValidationResult<CreateThemeData> {
  return validateThemeInput(createThemeInputSchema, input)
}

function validateUpdateThemeInput(
  input: UpdateThemeInput
): ValidationResult<UpdateThemeData> {
  return validateThemeInput(updateThemeInputSchema, input)
}

function validateDeleteThemeInput(
  input: DeleteThemeInput
): ValidationResult<DeleteThemeData> {
  return validateThemeInput(deleteThemeInputSchema, input)
}

async function submitThemeMutation<TInput, TData>({
  collector,
  input,
  dependencies,
  validate,
  run,
  successResult,
  missingResult,
}: SubmitThemeMutationOptions<TInput, TData>): Promise<ThemeMutationResult> {
  if (!hasThemeMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validate(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies = await resolveThemeMutationDependencies(
    dependencies
  )

  try {
    const mutationResult = await run(resolvedDependencies, validationResult.data)

    if (mutationResult === null && missingResult !== undefined) {
      return missingResult
    }

    return successResult
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitCreateTheme(
  collector: CollectorWithRole | null,
  input: CreateThemeInput,
  dependencies?: ThemeMutationDependencies
): Promise<ThemeMutationResult> {
  return submitThemeMutation({
    collector,
    input,
    dependencies,
    validate: validateCreateThemeInput,
    run: (resolvedDependencies, data) =>
      resolvedDependencies.createTheme(data),
    successResult: THEME_CREATE_SUCCESS_RESULT,
  })
}

export async function submitUpdateTheme(
  collector: CollectorWithRole | null,
  input: UpdateThemeInput,
  dependencies?: ThemeMutationDependencies
): Promise<ThemeMutationResult> {
  return submitThemeMutation({
    collector,
    input,
    dependencies,
    validate: validateUpdateThemeInput,
    run: (resolvedDependencies, data) =>
      resolvedDependencies.updateTheme(data),
    successResult: THEME_UPDATE_SUCCESS_RESULT,
    missingResult: createFormErrorResult(THEME_MISSING_ERROR),
  })
}

export async function submitDeleteTheme(
  collector: CollectorWithRole | null,
  input: DeleteThemeInput,
  dependencies?: ThemeMutationDependencies
): Promise<ThemeMutationResult> {
  return submitThemeMutation({
    collector,
    input,
    dependencies,
    validate: validateDeleteThemeInput,
    run: (resolvedDependencies, data) =>
      resolvedDependencies.deleteTheme(data),
    successResult: THEME_DELETE_SUCCESS_RESULT,
    missingResult: createFormErrorResult(THEME_MISSING_ERROR),
  })
}
