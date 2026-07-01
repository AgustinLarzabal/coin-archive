import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const SHAPE_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Shapes."
export const SHAPE_DUPLICATE_CODE_ERROR =
  "A Shape with this code already exists."
export const SHAPE_GENERIC_SAVE_ERROR = "Unable to save Shape right now."
export const SHAPE_MISSING_ERROR = "Shape no longer exists."
export const SHAPE_IN_USE_DELETE_ERROR =
  "Shape cannot be deleted while Coins still use it. Remove or reassign the Shape on those Coins before deleting it."
export const SHAPE_INVALID_CODE_ERROR =
  "Shape Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_SHAPE_CODE_CONSTRAINT = "shape_code_lower_unique_idx"
const INVALID_SHAPE_CODE_CONSTRAINT = "shape_code_slug_check"
const SHAPE_IN_USE_DELETE_CONSTRAINT = "coin_shape_id_shape_id_fk"
const SHAPE_FIELD_NAMES = ["code", "name"] as const

const shapeCodeSchema = z
  .string()
  .trim()
  .min(1, "Shape Code cannot be blank.")
  .max(255, "Shape Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, SHAPE_INVALID_CODE_ERROR)

const shapeNameSchema = z
  .string()
  .trim()
  .min(1, "Shape Name cannot be blank.")
  .max(255, "Shape Name must be 255 characters or fewer.")

export const createShapeInputSchema = z.object({
  code: shapeCodeSchema,
  name: shapeNameSchema,
})

export const updateShapeInputSchema = createShapeInputSchema.extend({
  id: z.uuid(),
})

export const deleteShapeInputSchema = z.object({
  id: z.uuid(),
})

type ShapeFieldName = (typeof SHAPE_FIELD_NAMES)[number]

export type ShapeFieldErrors = Partial<Record<ShapeFieldName, string>>

export type ShapeMutationResult =
  | {
      status: "error"
      fieldErrors: ShapeFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type ShapeAuthorizationErrorResult = {
  status: "error"
  formError: typeof SHAPE_AUTHORIZATION_ERROR
}

type CreateShapeInput = z.input<typeof createShapeInputSchema>
type CreateShapeData = z.output<typeof createShapeInputSchema>
type UpdateShapeInput = z.input<typeof updateShapeInputSchema>
type UpdateShapeData = z.output<typeof updateShapeInputSchema>
type DeleteShapeInput = z.input<typeof deleteShapeInputSchema>
type DeleteShapeData = z.output<typeof deleteShapeInputSchema>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: ShapeMutationResult }
type ShapeMutationExecutor<TData> = (
  dependencies: ShapeMutationDependencies,
  data: TData
) => Promise<unknown | null>
type SubmitShapeMutationOptions<TInput, TData> = {
  collector: CollectorWithRole | null
  input: TInput
  dependencies?: ShapeMutationDependencies
  validate: (input: TInput) => ValidationResult<TData>
  runMutation: ShapeMutationExecutor<TData>
  createSuccessResult: () => ShapeMutationResult
  createMissingResult?: () => ShapeMutationResult
}

type ShapeMutationDependencies = {
  createShape: (input: CreateShapeData) => Promise<unknown>
  deleteShape: (input: DeleteShapeData) => Promise<unknown | null>
  updateShape: (input: UpdateShapeData) => Promise<unknown | null>
}

async function getDefaultShapeMutationDependencies(): Promise<ShapeMutationDependencies> {
  const { createShape, deleteShape, updateShape } =
    await import("@workspace/db")

  return {
    createShape,
    deleteShape,
    updateShape,
  }
}

async function resolveShapeMutationDependencies(
  dependencies?: ShapeMutationDependencies
): Promise<ShapeMutationDependencies> {
  return dependencies ?? getDefaultShapeMutationDependencies()
}

export function createShapeAuthorizationError(): ShapeAuthorizationErrorResult {
  return {
    status: "error",
    formError: SHAPE_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): ShapeMutationResult {
  return {
    ...createShapeAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(
  fieldErrors: ShapeFieldErrors
): ShapeMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): ShapeMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasShapeMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isShapeFieldName(field: unknown): field is ShapeFieldName {
  return (
    typeof field === "string" &&
    SHAPE_FIELD_NAMES.includes(field as ShapeFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getShapeFieldErrors(issues: z.ZodIssue[]): ShapeFieldErrors {
  const fieldErrors: ShapeFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isShapeFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): ShapeMutationResult {
  return createFieldErrorResult(getShapeFieldErrors(issues))
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

function createPersistenceError(error: unknown): ShapeMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_SHAPE_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: SHAPE_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      SHAPE_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createFormErrorResult(SHAPE_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_SHAPE_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: SHAPE_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(SHAPE_GENERIC_SAVE_ERROR)
}

function validateShapeInput<TSchema extends z.ZodType>(
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

function validateCreateShapeInput(
  input: CreateShapeInput
): ValidationResult<CreateShapeData> {
  return validateShapeInput(createShapeInputSchema, input)
}

function validateUpdateShapeInput(
  input: UpdateShapeInput
): ValidationResult<UpdateShapeData> {
  return validateShapeInput(updateShapeInputSchema, input)
}

function validateDeleteShapeInput(
  input: DeleteShapeInput
): ValidationResult<DeleteShapeData> {
  return validateShapeInput(deleteShapeInputSchema, input)
}

async function submitShapeMutation<TInput, TData>({
  collector,
  input,
  dependencies,
  validate,
  runMutation,
  createSuccessResult,
  createMissingResult,
}: SubmitShapeMutationOptions<TInput, TData>): Promise<ShapeMutationResult> {
  if (!hasShapeMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validate(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    await resolveShapeMutationDependencies(dependencies)

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

export async function submitCreateShape(
  collector: CollectorWithRole | null,
  input: CreateShapeInput,
  dependencies?: ShapeMutationDependencies
): Promise<ShapeMutationResult> {
  return submitShapeMutation({
    collector,
    input,
    dependencies,
    validate: validateCreateShapeInput,
    runMutation: (resolvedDependencies, data) =>
      resolvedDependencies.createShape(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Shape added.",
    }),
  })
}

export async function submitUpdateShape(
  collector: CollectorWithRole | null,
  input: UpdateShapeInput,
  dependencies?: ShapeMutationDependencies
): Promise<ShapeMutationResult> {
  return submitShapeMutation({
    collector,
    input,
    dependencies,
    validate: validateUpdateShapeInput,
    runMutation: (resolvedDependencies, data) =>
      resolvedDependencies.updateShape(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Saved.",
    }),
    createMissingResult: () => createFormErrorResult(SHAPE_MISSING_ERROR),
  })
}

export async function submitDeleteShape(
  collector: CollectorWithRole | null,
  input: DeleteShapeInput,
  dependencies?: ShapeMutationDependencies
): Promise<ShapeMutationResult> {
  return submitShapeMutation({
    collector,
    input,
    dependencies,
    validate: validateDeleteShapeInput,
    runMutation: (resolvedDependencies, data) =>
      resolvedDependencies.deleteShape(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Shape deleted.",
    }),
    createMissingResult: () => createFormErrorResult(SHAPE_MISSING_ERROR),
  })
}
