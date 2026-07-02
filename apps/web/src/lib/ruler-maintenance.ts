import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const RULER_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Rulers."
export const RULER_DUPLICATE_CODE_ERROR =
  "A Ruler with this code already exists."
export const RULER_GENERIC_SAVE_ERROR = "Unable to save Ruler right now."
export const RULER_MISSING_ERROR = "Ruler no longer exists."
export const RULER_IN_USE_DELETE_GUIDANCE =
  "Remove those Coin Ruler Attributions before deleting it."
export const RULER_IN_USE_DELETE_ERROR =
  `Ruler cannot be deleted while Coins still have Ruler Attributions to it. ${RULER_IN_USE_DELETE_GUIDANCE}`
export const RULER_INVALID_CODE_ERROR =
  "Ruler Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_RULER_CODE_CONSTRAINT = "ruler_code_unique_idx"
const INVALID_RULER_CODE_CONSTRAINT = "ruler_code_slug_check"
const RULER_IN_USE_DELETE_CONSTRAINT = "coin_ruler_ruler_id_ruler_id_fk"
const RULER_FIELD_NAMES = ["code", "name", "rulerGroupId"] as const

const rulerCodeSchema = z
  .string()
  .trim()
  .min(1, "Ruler Code cannot be blank.")
  .max(255, "Ruler Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, RULER_INVALID_CODE_ERROR)

const rulerNameSchema = z
  .string()
  .trim()
  .min(1, "Ruler Name cannot be blank.")
  .max(255, "Ruler Name must be 255 characters or fewer.")

const rulerGroupIdSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value
  }

  const normalizedValue = value.trim()

  return normalizedValue.length === 0 ? null : normalizedValue
}, z.uuid().nullable())

export const createRulerInputSchema = z.object({
  code: rulerCodeSchema,
  name: rulerNameSchema,
  rulerGroupId: rulerGroupIdSchema,
})

export const updateRulerInputSchema = createRulerInputSchema.extend({
  id: z.uuid(),
})

export const deleteRulerInputSchema = z.object({
  id: z.uuid(),
})

type RulerFieldName = (typeof RULER_FIELD_NAMES)[number]

export type RulerFieldErrors = Partial<Record<RulerFieldName, string>>

export type RulerMutationResult =
  | {
      status: "error"
      fieldErrors: RulerFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type RulerAuthorizationErrorResult = {
  status: "error"
  formError: typeof RULER_AUTHORIZATION_ERROR
}

type CreateRulerInput = z.input<typeof createRulerInputSchema>
type CreateRulerData = z.output<typeof createRulerInputSchema>
type UpdateRulerInput = z.input<typeof updateRulerInputSchema>
type UpdateRulerData = z.output<typeof updateRulerInputSchema>
type DeleteRulerInput = z.input<typeof deleteRulerInputSchema>
type DeleteRulerData = z.output<typeof deleteRulerInputSchema>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: RulerMutationResult }
type RulerMutationExecutor<TData> = (
  dependencies: RulerMutationDependencies,
  data: TData
) => Promise<unknown | null>
type SubmitRulerMutationOptions<TInput, TData> = {
  collector: CollectorWithRole | null
  input: TInput
  dependencies?: RulerMutationDependencies
  validate: (input: TInput) => ValidationResult<TData>
  runMutation: RulerMutationExecutor<TData>
  createSuccessResult: () => RulerMutationResult
  createMissingResult?: () => RulerMutationResult
}

type RulerMutationDependencies = {
  createRuler: (input: CreateRulerData) => Promise<unknown>
  deleteRuler: (input: DeleteRulerData) => Promise<unknown | null>
  updateRuler: (input: UpdateRulerData) => Promise<unknown | null>
}

async function getDefaultRulerMutationDependencies(): Promise<RulerMutationDependencies> {
  const { createRuler, deleteRuler, updateRuler } = await import("@workspace/db")

  return {
    createRuler,
    deleteRuler,
    updateRuler,
  }
}

async function resolveRulerMutationDependencies(
  dependencies?: RulerMutationDependencies
): Promise<RulerMutationDependencies> {
  return dependencies ?? getDefaultRulerMutationDependencies()
}

export function createRulerAuthorizationError(): RulerAuthorizationErrorResult {
  return {
    status: "error",
    formError: RULER_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): RulerMutationResult {
  return {
    ...createRulerAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(fieldErrors: RulerFieldErrors): RulerMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): RulerMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasRulerMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isRulerFieldName(field: unknown): field is RulerFieldName {
  return typeof field === "string" && RULER_FIELD_NAMES.includes(field as RulerFieldName)
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getRulerFieldErrors(issues: z.ZodIssue[]): RulerFieldErrors {
  const fieldErrors: RulerFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isRulerFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): RulerMutationResult {
  return createFieldErrorResult(getRulerFieldErrors(issues))
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

function createPersistenceError(error: unknown): RulerMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_RULER_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: RULER_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      RULER_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createFormErrorResult(RULER_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_RULER_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: RULER_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(RULER_GENERIC_SAVE_ERROR)
}

function validateRulerInput<TSchema extends z.ZodType>(
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

function validateCreateRulerInput(
  input: CreateRulerInput
): ValidationResult<CreateRulerData> {
  return validateRulerInput(createRulerInputSchema, input)
}

function validateUpdateRulerInput(
  input: UpdateRulerInput
): ValidationResult<UpdateRulerData> {
  return validateRulerInput(updateRulerInputSchema, input)
}

function validateDeleteRulerInput(
  input: DeleteRulerInput
): ValidationResult<DeleteRulerData> {
  return validateRulerInput(deleteRulerInputSchema, input)
}

async function submitRulerMutation<TInput, TData>({
  collector,
  input,
  dependencies,
  validate,
  runMutation,
  createSuccessResult,
  createMissingResult,
}: SubmitRulerMutationOptions<TInput, TData>): Promise<RulerMutationResult> {
  if (!hasRulerMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validate(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies = await resolveRulerMutationDependencies(dependencies)

  try {
    const mutationResult = await runMutation(
      resolvedDependencies,
      validationResult.data
    )

    if (mutationResult === null) {
      return createMissingResult?.() ?? createFormErrorResult(RULER_MISSING_ERROR)
    }

    return createSuccessResult()
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitCreateRuler(
  collector: CollectorWithRole | null,
  input: CreateRulerInput,
  dependencies?: RulerMutationDependencies
): Promise<RulerMutationResult> {
  return submitRulerMutation({
    collector,
    input,
    dependencies,
    validate: validateCreateRulerInput,
    runMutation: (resolvedDependencies, data) => resolvedDependencies.createRuler(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Ruler added.",
    }),
  })
}

export async function submitUpdateRuler(
  collector: CollectorWithRole | null,
  input: UpdateRulerInput,
  dependencies?: RulerMutationDependencies
): Promise<RulerMutationResult> {
  return submitRulerMutation({
    collector,
    input,
    dependencies,
    validate: validateUpdateRulerInput,
    runMutation: (resolvedDependencies, data) => resolvedDependencies.updateRuler(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Saved.",
    }),
    createMissingResult: () => createFormErrorResult(RULER_MISSING_ERROR),
  })
}

export async function submitDeleteRuler(
  collector: CollectorWithRole | null,
  input: DeleteRulerInput,
  dependencies?: RulerMutationDependencies
): Promise<RulerMutationResult> {
  return submitRulerMutation({
    collector,
    input,
    dependencies,
    validate: validateDeleteRulerInput,
    runMutation: (resolvedDependencies, data) => resolvedDependencies.deleteRuler(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Ruler deleted.",
    }),
    createMissingResult: () => createFormErrorResult(RULER_MISSING_ERROR),
  })
}
