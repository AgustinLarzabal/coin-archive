import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const COMPOSITION_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Compositions."
export const COMPOSITION_DUPLICATE_CODE_ERROR =
  "A Composition with this code already exists."
export const COMPOSITION_GENERIC_SAVE_ERROR =
  "Unable to save Composition right now."
export const COMPOSITION_MISSING_ERROR = "Composition no longer exists."
export const COMPOSITION_DELETE_REASSIGN_REQUIRED_MESSAGE =
  "Every Coin has exactly one Composition, so those Coins must be reassigned to another Composition before this Composition can be deleted."
export const COMPOSITION_IN_USE_DELETE_ERROR =
  `Composition cannot be deleted while Coins still use it. ${COMPOSITION_DELETE_REASSIGN_REQUIRED_MESSAGE}`
export const COMPOSITION_INVALID_CODE_ERROR =
  "Composition Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_COMPOSITION_CODE_CONSTRAINT =
  "composition_code_lower_unique_idx"
const INVALID_COMPOSITION_CODE_CONSTRAINT = "composition_code_slug_check"
const COMPOSITION_IN_USE_DELETE_CONSTRAINT =
  "coin_composition_id_composition_id_fk"
const COMPOSITION_FIELD_NAMES = ["code", "name", "description"] as const

const compositionCodeSchema = z
  .string()
  .trim()
  .min(1, "Composition Code cannot be blank.")
  .max(255, "Composition Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, COMPOSITION_INVALID_CODE_ERROR)

const compositionNameSchema = z
  .string()
  .trim()
  .min(1, "Composition Name cannot be blank.")
  .max(255, "Composition Name must be 255 characters or fewer.")

const compositionDescriptionSchema = z
  .string()
  .optional()
  .transform((description) => {
    const trimmedDescription = description?.trim()

    if (!trimmedDescription) {
      return null
    }

    return trimmedDescription
  })

export const createCompositionInputSchema = z.object({
  code: compositionCodeSchema,
  name: compositionNameSchema,
  description: compositionDescriptionSchema,
})

export const updateCompositionInputSchema = createCompositionInputSchema.extend(
  {
    id: z.uuid(),
  }
)

export const deleteCompositionInputSchema = z.object({
  id: z.uuid(),
})

type CompositionFieldName = (typeof COMPOSITION_FIELD_NAMES)[number]

export type CompositionFieldErrors = Partial<
  Record<CompositionFieldName, string>
>

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

type CompositionMutationDependencies = {
  createComposition: (input: CreateCompositionData) => Promise<unknown>
  deleteComposition: (input: DeleteCompositionData) => Promise<unknown | null>
  updateComposition: (input: UpdateCompositionData) => Promise<unknown | null>
}

async function getDefaultCompositionMutationDependencies(): Promise<CompositionMutationDependencies> {
  const { createComposition, deleteComposition, updateComposition } =
    await import("@workspace/db")

  return {
    createComposition,
    deleteComposition,
    updateComposition,
  }
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

export function hasCompositionMaintenanceAccess(
  collector: CollectorWithRole | null
) {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isCompositionFieldName(field: unknown): field is CompositionFieldName {
  return (
    typeof field === "string" &&
    COMPOSITION_FIELD_NAMES.includes(field as CompositionFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getCompositionFieldErrors(
  issues: z.ZodIssue[]
): CompositionFieldErrors {
  const fieldErrors: CompositionFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isCompositionFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(
  issues: z.ZodIssue[]
): CompositionMutationResult {
  return createFieldErrorResult(getCompositionFieldErrors(issues))
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

function createPersistenceError(error: unknown): CompositionMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_COMPOSITION_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: COMPOSITION_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      COMPOSITION_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createFormErrorResult(COMPOSITION_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_COMPOSITION_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: COMPOSITION_INVALID_CODE_ERROR,
    })
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

  const resolvedDependencies =
    dependencies ?? (await getDefaultCompositionMutationDependencies())

  try {
    await resolvedDependencies.createComposition(validationResult.data)

    return {
      status: "success",
      message: "Composition added.",
    }
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

  const resolvedDependencies =
    dependencies ?? (await getDefaultCompositionMutationDependencies())

  try {
    const updatedComposition = await resolvedDependencies.updateComposition(
      validationResult.data
    )

    if (updatedComposition === null) {
      return createFormErrorResult(COMPOSITION_MISSING_ERROR)
    }

    return {
      status: "success",
      message: "Saved.",
    }
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

  const resolvedDependencies =
    dependencies ?? (await getDefaultCompositionMutationDependencies())

  try {
    const deletedComposition = await resolvedDependencies.deleteComposition(
      validationResult.data
    )

    if (deletedComposition === null) {
      return createFormErrorResult(COMPOSITION_MISSING_ERROR)
    }

    return {
      status: "success",
      message: "Composition deleted.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}
