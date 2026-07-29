import { hasEditorAccess } from "@coin-archive/auth/client"
import { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

export const EDGE_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Edges."
export const EDGE_DUPLICATE_CODE_ERROR =
  "An Edge with this code already exists."
export const EDGE_GENERIC_SAVE_ERROR = "Unable to save Edge right now."
export const EDGE_MISSING_ERROR = "Edge no longer exists."
export const EDGE_IN_USE_DELETE_ERROR =
  "Edge cannot be deleted while Coins still use it. Remove or reassign the Edge on those Coins before deleting it."
export const EDGE_INVALID_CODE_ERROR =
  "Edge Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_EDGE_CODE_CONSTRAINT = "edge_code_lower_unique_idx"
const INVALID_EDGE_CODE_CONSTRAINT = "edge_code_slug_check"
const EDGE_IN_USE_DELETE_CONSTRAINT = "coin_edge_id_edge_id_fk"
const EDGE_FIELD_NAMES = ["code", "name"] as const

const edgeCodeSchema = z
  .string()
  .trim()
  .min(1, "Edge Code cannot be blank.")
  .max(255, "Edge Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, EDGE_INVALID_CODE_ERROR)

const edgeNameSchema = z
  .string()
  .trim()
  .min(1, "Edge Name cannot be blank.")
  .max(255, "Edge Name must be 255 characters or fewer.")

export const createEdgeInputSchema = z.object({
  code: edgeCodeSchema,
  name: edgeNameSchema,
})

export const updateEdgeInputSchema = createEdgeInputSchema.extend({
  id: z.uuid(),
})

export const deleteEdgeInputSchema = z.object({
  id: z.uuid(),
})

type EdgeFieldName = (typeof EDGE_FIELD_NAMES)[number]

export type EdgeFieldErrors = Partial<Record<EdgeFieldName, string>>

export type EdgeMutationResult =
  | {
      status: "error"
      fieldErrors: EdgeFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type EdgeAuthorizationErrorResult = {
  status: "error"
  formError: typeof EDGE_AUTHORIZATION_ERROR
}

type CreateEdgeInput = z.input<typeof createEdgeInputSchema>
type CreateEdgeData = z.output<typeof createEdgeInputSchema>
type UpdateEdgeInput = z.input<typeof updateEdgeInputSchema>
type UpdateEdgeData = z.output<typeof updateEdgeInputSchema>
type DeleteEdgeInput = z.input<typeof deleteEdgeInputSchema>
type DeleteEdgeData = z.output<typeof deleteEdgeInputSchema>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: EdgeMutationResult }
type EdgeMutationOperationResult = unknown | null
type SubmitEdgeMutationOptions<TInput, TData> = {
  collector: CollectorWithRole | null
  input: TInput
  dependencies?: EdgeMutationDependencies
  validate: (input: TInput) => ValidationResult<TData>
  execute: (
    dependencies: EdgeMutationDependencies,
    data: TData
  ) => Promise<EdgeMutationOperationResult>
  createSuccessResult: () => EdgeMutationResult
  createNullResult?: () => EdgeMutationResult
}

type EdgeMutationDependencies = {
  createEdge: (input: CreateEdgeData) => Promise<unknown>
  deleteEdge: (input: DeleteEdgeData) => Promise<unknown | null>
  updateEdge: (input: UpdateEdgeData) => Promise<unknown | null>
}

async function getDefaultEdgeMutationDependencies(): Promise<EdgeMutationDependencies> {
  const { createEdge, deleteEdge, updateEdge } = await import("@coin-archive/db")

  return {
    createEdge,
    deleteEdge,
    updateEdge,
  }
}

async function resolveEdgeMutationDependencies(
  dependencies?: EdgeMutationDependencies
): Promise<EdgeMutationDependencies> {
  return dependencies ?? getDefaultEdgeMutationDependencies()
}

export function createEdgeAuthorizationError(): EdgeAuthorizationErrorResult {
  return {
    status: "error",
    formError: EDGE_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): EdgeMutationResult {
  return {
    ...createEdgeAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(
  fieldErrors: EdgeFieldErrors
): EdgeMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): EdgeMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasEdgeMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isEdgeFieldName(field: unknown): field is EdgeFieldName {
  return (
    typeof field === "string" &&
    EDGE_FIELD_NAMES.includes(field as EdgeFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getEdgeFieldErrors(issues: z.ZodIssue[]): EdgeFieldErrors {
  const fieldErrors: EdgeFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isEdgeFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): EdgeMutationResult {
  return createFieldErrorResult(getEdgeFieldErrors(issues))
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

function createPersistenceError(error: unknown): EdgeMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_EDGE_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: EDGE_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      EDGE_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createFormErrorResult(EDGE_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_EDGE_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: EDGE_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(EDGE_GENERIC_SAVE_ERROR)
}

function validateEdgeInput<TSchema extends z.ZodType>(
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

function validateCreateEdgeInput(
  input: CreateEdgeInput
): ValidationResult<CreateEdgeData> {
  return validateEdgeInput(createEdgeInputSchema, input)
}

function validateUpdateEdgeInput(
  input: UpdateEdgeInput
): ValidationResult<UpdateEdgeData> {
  return validateEdgeInput(updateEdgeInputSchema, input)
}

function validateDeleteEdgeInput(
  input: DeleteEdgeInput
): ValidationResult<DeleteEdgeData> {
  return validateEdgeInput(deleteEdgeInputSchema, input)
}

async function submitEdgeMutation<TInput, TData>({
  collector,
  input,
  dependencies,
  validate,
  execute,
  createSuccessResult,
  createNullResult,
}: SubmitEdgeMutationOptions<TInput, TData>): Promise<EdgeMutationResult> {
  if (!hasEdgeMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validate(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    await resolveEdgeMutationDependencies(dependencies)

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

export async function submitCreateEdge(
  collector: CollectorWithRole | null,
  input: CreateEdgeInput,
  dependencies?: EdgeMutationDependencies
): Promise<EdgeMutationResult> {
  return submitEdgeMutation({
    collector,
    input,
    dependencies,
    validate: validateCreateEdgeInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.createEdge(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Edge added.",
    }),
  })
}

export async function submitUpdateEdge(
  collector: CollectorWithRole | null,
  input: UpdateEdgeInput,
  dependencies?: EdgeMutationDependencies
): Promise<EdgeMutationResult> {
  return submitEdgeMutation({
    collector,
    input,
    dependencies,
    validate: validateUpdateEdgeInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.updateEdge(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Saved.",
    }),
    createNullResult: () => createFormErrorResult(EDGE_MISSING_ERROR),
  })
}

export async function submitDeleteEdge(
  collector: CollectorWithRole | null,
  input: DeleteEdgeInput,
  dependencies?: EdgeMutationDependencies
): Promise<EdgeMutationResult> {
  return submitEdgeMutation({
    collector,
    input,
    dependencies,
    validate: validateDeleteEdgeInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.deleteEdge(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Edge deleted.",
    }),
    createNullResult: () => createFormErrorResult(EDGE_MISSING_ERROR),
  })
}
