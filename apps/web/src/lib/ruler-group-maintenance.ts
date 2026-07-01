import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const RULER_GROUP_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Ruler Groups."
export const RULER_GROUP_DUPLICATE_CODE_ERROR =
  "A Ruler Group with this code already exists."
export const RULER_GROUP_GENERIC_SAVE_ERROR =
  "Unable to save Ruler Group right now."
export const RULER_GROUP_MISSING_ERROR = "Ruler Group no longer exists."
export const RULER_GROUP_IN_USE_DELETE_GUIDANCE =
  "Remove or reassign those Rulers before deleting it."
export const RULER_GROUP_IN_USE_DELETE_ERROR =
  `Ruler Group cannot be deleted while Rulers still belong to it. ${RULER_GROUP_IN_USE_DELETE_GUIDANCE}`
export const RULER_GROUP_INVALID_CODE_ERROR =
  "Ruler Group Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_RULER_GROUP_CODE_CONSTRAINT = "ruler_group_code_unique_idx"
const INVALID_RULER_GROUP_CODE_CONSTRAINT = "ruler_group_code_slug_check"
const RULER_GROUP_IN_USE_DELETE_CONSTRAINT =
  "ruler_ruler_group_id_ruler_group_id_fk"
const RULER_GROUP_FIELD_NAMES = ["code", "name"] as const

const rulerGroupCodeSchema = z
  .string()
  .trim()
  .min(1, "Ruler Group Code cannot be blank.")
  .max(255, "Ruler Group Code must be 255 characters or fewer.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    RULER_GROUP_INVALID_CODE_ERROR
  )

const rulerGroupNameSchema = z
  .string()
  .trim()
  .min(1, "Ruler Group Name cannot be blank.")
  .max(255, "Ruler Group Name must be 255 characters or fewer.")

export const createRulerGroupInputSchema = z.object({
  code: rulerGroupCodeSchema,
  name: rulerGroupNameSchema,
})

export const updateRulerGroupInputSchema = createRulerGroupInputSchema.extend({
  id: z.uuid(),
})

export const deleteRulerGroupInputSchema = z.object({
  id: z.uuid(),
})

type RulerGroupFieldName = (typeof RULER_GROUP_FIELD_NAMES)[number]

export type RulerGroupFieldErrors = Partial<
  Record<RulerGroupFieldName, string>
>

export type RulerGroupMutationResult =
  | {
      status: "error"
      fieldErrors: RulerGroupFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type RulerGroupAuthorizationErrorResult = {
  status: "error"
  formError: typeof RULER_GROUP_AUTHORIZATION_ERROR
}

type CreateRulerGroupInput = z.input<typeof createRulerGroupInputSchema>
type CreateRulerGroupData = z.output<typeof createRulerGroupInputSchema>
type UpdateRulerGroupInput = z.input<typeof updateRulerGroupInputSchema>
type UpdateRulerGroupData = z.output<typeof updateRulerGroupInputSchema>
type DeleteRulerGroupInput = z.input<typeof deleteRulerGroupInputSchema>
type DeleteRulerGroupData = z.output<typeof deleteRulerGroupInputSchema>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: RulerGroupMutationResult }
type RulerGroupMutationExecutor<TData> = (
  dependencies: RulerGroupMutationDependencies,
  data: TData
) => Promise<unknown | null>
type SubmitRulerGroupMutationOptions<TInput, TData> = {
  collector: CollectorWithRole | null
  input: TInput
  dependencies?: RulerGroupMutationDependencies
  validate: (input: TInput) => ValidationResult<TData>
  runMutation: RulerGroupMutationExecutor<TData>
  createSuccessResult: () => RulerGroupMutationResult
  createMissingResult?: () => RulerGroupMutationResult
}

type RulerGroupMutationDependencies = {
  createRulerGroup: (input: CreateRulerGroupData) => Promise<unknown>
  deleteRulerGroup: (
    input: DeleteRulerGroupData
  ) => Promise<unknown | null>
  updateRulerGroup: (
    input: UpdateRulerGroupData
  ) => Promise<unknown | null>
}

async function getDefaultRulerGroupMutationDependencies(): Promise<RulerGroupMutationDependencies> {
  const { createRulerGroup, deleteRulerGroup, updateRulerGroup } =
    await import("@workspace/db")

  return {
    createRulerGroup,
    deleteRulerGroup,
    updateRulerGroup,
  }
}

async function resolveRulerGroupMutationDependencies(
  dependencies?: RulerGroupMutationDependencies
): Promise<RulerGroupMutationDependencies> {
  return dependencies ?? getDefaultRulerGroupMutationDependencies()
}

export function createRulerGroupAuthorizationError(): RulerGroupAuthorizationErrorResult {
  return {
    status: "error",
    formError: RULER_GROUP_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): RulerGroupMutationResult {
  return {
    ...createRulerGroupAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(
  fieldErrors: RulerGroupFieldErrors
): RulerGroupMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): RulerGroupMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasRulerGroupMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isRulerGroupFieldName(field: unknown): field is RulerGroupFieldName {
  return (
    typeof field === "string" &&
    RULER_GROUP_FIELD_NAMES.includes(field as RulerGroupFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getRulerGroupFieldErrors(
  issues: z.ZodIssue[]
): RulerGroupFieldErrors {
  const fieldErrors: RulerGroupFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isRulerGroupFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): RulerGroupMutationResult {
  return createFieldErrorResult(getRulerGroupFieldErrors(issues))
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

function createPersistenceError(error: unknown): RulerGroupMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_RULER_GROUP_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: RULER_GROUP_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      RULER_GROUP_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createFormErrorResult(RULER_GROUP_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_RULER_GROUP_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: RULER_GROUP_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(RULER_GROUP_GENERIC_SAVE_ERROR)
}

function validateRulerGroupInput<TSchema extends z.ZodType>(
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

function validateCreateRulerGroupInput(
  input: CreateRulerGroupInput
): ValidationResult<CreateRulerGroupData> {
  return validateRulerGroupInput(createRulerGroupInputSchema, input)
}

function validateUpdateRulerGroupInput(
  input: UpdateRulerGroupInput
): ValidationResult<UpdateRulerGroupData> {
  return validateRulerGroupInput(updateRulerGroupInputSchema, input)
}

function validateDeleteRulerGroupInput(
  input: DeleteRulerGroupInput
): ValidationResult<DeleteRulerGroupData> {
  return validateRulerGroupInput(deleteRulerGroupInputSchema, input)
}

async function submitRulerGroupMutation<TInput, TData>({
  collector,
  input,
  dependencies,
  validate,
  runMutation,
  createSuccessResult,
  createMissingResult,
}: SubmitRulerGroupMutationOptions<TInput, TData>): Promise<RulerGroupMutationResult> {
  if (!hasRulerGroupMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validate(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    await resolveRulerGroupMutationDependencies(dependencies)

  try {
    const mutationResult = await runMutation(
      resolvedDependencies,
      validationResult.data
    )

    if (mutationResult === null) {
      return (
        createMissingResult?.() ?? createFormErrorResult(RULER_GROUP_MISSING_ERROR)
      )
    }

    return createSuccessResult()
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitCreateRulerGroup(
  collector: CollectorWithRole | null,
  input: CreateRulerGroupInput,
  dependencies?: RulerGroupMutationDependencies
): Promise<RulerGroupMutationResult> {
  return submitRulerGroupMutation({
    collector,
    input,
    dependencies,
    validate: validateCreateRulerGroupInput,
    runMutation: (resolvedDependencies, data) =>
      resolvedDependencies.createRulerGroup(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Ruler Group added.",
    }),
  })
}

export async function submitUpdateRulerGroup(
  collector: CollectorWithRole | null,
  input: UpdateRulerGroupInput,
  dependencies?: RulerGroupMutationDependencies
): Promise<RulerGroupMutationResult> {
  return submitRulerGroupMutation({
    collector,
    input,
    dependencies,
    validate: validateUpdateRulerGroupInput,
    runMutation: (resolvedDependencies, data) =>
      resolvedDependencies.updateRulerGroup(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Saved.",
    }),
    createMissingResult: () => createFormErrorResult(RULER_GROUP_MISSING_ERROR),
  })
}

export async function submitDeleteRulerGroup(
  collector: CollectorWithRole | null,
  input: DeleteRulerGroupInput,
  dependencies?: RulerGroupMutationDependencies
): Promise<RulerGroupMutationResult> {
  return submitRulerGroupMutation({
    collector,
    input,
    dependencies,
    validate: validateDeleteRulerGroupInput,
    runMutation: (resolvedDependencies, data) =>
      resolvedDependencies.deleteRulerGroup(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Ruler Group deleted.",
    }),
    createMissingResult: () => createFormErrorResult(RULER_GROUP_MISSING_ERROR),
  })
}
