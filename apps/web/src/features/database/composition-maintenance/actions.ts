import { hasEditorAccess } from "@workspace/auth/client"
import type { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  COMPOSITION_AUTHORIZATION_ERROR,
  COMPOSITION_CREATED_MESSAGE,
  COMPOSITION_DELETED_MESSAGE,
  COMPOSITION_DUPLICATE_CODE_ERROR,
  COMPOSITION_GENERIC_SAVE_ERROR,
  COMPOSITION_IN_USE_DELETE_ERROR,
  COMPOSITION_INVALID_CODE_ERROR,
  COMPOSITION_MISSING_ERROR,
  COMPOSITION_UPDATED_MESSAGE,
} from "./messages"
import {
  createCompositionInputSchema,
  deleteCompositionInputSchema,
  getCompositionFieldErrors,
  updateCompositionInputSchema,
} from "./validation"
import type { CompositionFieldErrors } from "./validation"

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_COMPOSITION_CODE_CONSTRAINT =
  "composition_code_lower_unique_idx"
const INVALID_COMPOSITION_CODE_CONSTRAINT = "composition_code_slug_check"
const COMPOSITION_IN_USE_DELETE_CONSTRAINT =
  "coin_composition_id_composition_id_fk"

export type CompositionMutationResult =
  | {
      status: "error"
      fieldErrors: CompositionFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type CompositionAuthorizationErrorResult = {
  status: "error"
  formError: typeof COMPOSITION_AUTHORIZATION_ERROR
}

type CreateCompositionInput = z.input<typeof createCompositionInputSchema>
type CreateCompositionData = z.output<typeof createCompositionInputSchema>
type UpdateCompositionInput = z.input<typeof updateCompositionInputSchema>
type UpdateCompositionData = z.output<typeof updateCompositionInputSchema>
type DeleteCompositionInput = z.input<typeof deleteCompositionInputSchema>
type DeleteCompositionData = z.output<typeof deleteCompositionInputSchema>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: CompositionMutationResult }
type PostgresConstraintResult = {
  code: string
  constraintName: string
  result: CompositionMutationResult
}
type PostgresError = {
  code: unknown
  constraint_name: unknown
}

type CompositionMutationDependencies = {
  createComposition: (input: CreateCompositionData) => Promise<unknown>
  deleteComposition: (input: DeleteCompositionData) => Promise<unknown | null>
  updateComposition: (input: UpdateCompositionData) => Promise<unknown | null>
}

const POSTGRES_CONSTRAINT_RESULTS: PostgresConstraintResult[] = [
  {
    code: DUPLICATE_KEY_POSTGRES_ERROR_CODE,
    constraintName: DUPLICATE_COMPOSITION_CODE_CONSTRAINT,
    result: createFieldErrorResult({
      code: COMPOSITION_DUPLICATE_CODE_ERROR,
    }),
  },
  {
    code: FK_VIOLATION_POSTGRES_ERROR_CODE,
    constraintName: COMPOSITION_IN_USE_DELETE_CONSTRAINT,
    result: createFormErrorResult(COMPOSITION_IN_USE_DELETE_ERROR),
  },
  {
    code: CHECK_VIOLATION_POSTGRES_ERROR_CODE,
    constraintName: INVALID_COMPOSITION_CODE_CONSTRAINT,
    result: createFieldErrorResult({
      code: COMPOSITION_INVALID_CODE_ERROR,
    }),
  },
]

async function getDefaultCompositionMutationDependencies(): Promise<CompositionMutationDependencies> {
  const { createComposition, deleteComposition, updateComposition } =
    await import("@workspace/db")

  return {
    createComposition,
    deleteComposition,
    updateComposition,
  }
}

async function resolveCompositionMutationDependencies(
  dependencies?: CompositionMutationDependencies
): Promise<CompositionMutationDependencies> {
  return dependencies ?? getDefaultCompositionMutationDependencies()
}

export function createCompositionAuthorizationError(): CompositionAuthorizationErrorResult {
  return {
    status: "error",
    formError: COMPOSITION_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): CompositionMutationResult {
  return {
    ...createCompositionAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(
  fieldErrors: CompositionFieldErrors
): CompositionMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): CompositionMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

function createSuccessResult(message: string): CompositionMutationResult {
  return {
    status: "success",
    message,
  }
}

export function hasCompositionMaintenanceAccess(
  collector: CollectorWithRole | null
) {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isPostgresError(value: unknown): value is PostgresError {
  return isObjectRecord(value) && "code" in value && "constraint_name" in value
}

function createValidationError(
  issues: z.ZodIssue[]
): CompositionMutationResult {
  return createFieldErrorResult(getCompositionFieldErrors(issues))
}

function getPostgresError(error: unknown): PostgresError | null {
  if (!isObjectRecord(error)) {
    return null
  }

  const postgresError = "cause" in error ? error.cause : error

  if (!isPostgresError(postgresError)) {
    return null
  }

  return postgresError
}

function matchesPostgresConstraint(
  postgresError: PostgresError,
  code: string,
  constraintName: string
): boolean {
  return (
    postgresError.code === code &&
    postgresError.constraint_name === constraintName
  )
}

function createPersistenceError(error: unknown): CompositionMutationResult {
  const postgresError = getPostgresError(error)

  if (postgresError === null) {
    return createFormErrorResult(COMPOSITION_GENERIC_SAVE_ERROR)
  }

  for (const entry of POSTGRES_CONSTRAINT_RESULTS) {
    if (
      matchesPostgresConstraint(postgresError, entry.code, entry.constraintName)
    ) {
      return entry.result
    }
  }

  return createFormErrorResult(COMPOSITION_GENERIC_SAVE_ERROR)
}

function validateCompositionInput<TSchema extends z.ZodType>(
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

function validateCreateCompositionInput(
  input: CreateCompositionInput
): ValidationResult<CreateCompositionData> {
  return validateCompositionInput(createCompositionInputSchema, input)
}

function validateUpdateCompositionInput(
  input: UpdateCompositionInput
): ValidationResult<UpdateCompositionData> {
  return validateCompositionInput(updateCompositionInputSchema, input)
}

function validateDeleteCompositionInput(
  input: DeleteCompositionInput
): ValidationResult<DeleteCompositionData> {
  return validateCompositionInput(deleteCompositionInputSchema, input)
}

export async function submitCreateComposition(
  collector: CollectorWithRole | null,
  input: CreateCompositionInput,
  dependencies?: CompositionMutationDependencies
): Promise<CompositionMutationResult> {
  if (!hasCompositionMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateCreateCompositionInput(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const mutationDependencies =
    await resolveCompositionMutationDependencies(dependencies)

  try {
    await mutationDependencies.createComposition(validationResult.data)

    return createSuccessResult(COMPOSITION_CREATED_MESSAGE)
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitUpdateComposition(
  collector: CollectorWithRole | null,
  input: UpdateCompositionInput,
  dependencies?: CompositionMutationDependencies
): Promise<CompositionMutationResult> {
  if (!hasCompositionMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateUpdateCompositionInput(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const mutationDependencies =
    await resolveCompositionMutationDependencies(dependencies)

  try {
    const updatedComposition = await mutationDependencies.updateComposition(
      validationResult.data
    )

    if (updatedComposition === null) {
      return createFormErrorResult(COMPOSITION_MISSING_ERROR)
    }

    return createSuccessResult(COMPOSITION_UPDATED_MESSAGE)
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitDeleteComposition(
  collector: CollectorWithRole | null,
  input: DeleteCompositionInput,
  dependencies?: CompositionMutationDependencies
): Promise<CompositionMutationResult> {
  if (!hasCompositionMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateDeleteCompositionInput(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const mutationDependencies =
    await resolveCompositionMutationDependencies(dependencies)

  try {
    const deletedComposition = await mutationDependencies.deleteComposition(
      validationResult.data
    )

    if (deletedComposition === null) {
      return createFormErrorResult(COMPOSITION_MISSING_ERROR)
    }

    return createSuccessResult(COMPOSITION_DELETED_MESSAGE)
  } catch (error) {
    return createPersistenceError(error)
  }
}
