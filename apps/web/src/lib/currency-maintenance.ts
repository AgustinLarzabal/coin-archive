import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const CURRENCY_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Currencies."
export const CURRENCY_DUPLICATE_CODE_ERROR =
  "A Currency with this code already exists."
export const CURRENCY_GENERIC_SAVE_ERROR =
  "Unable to save Currency right now."
export const CURRENCY_MISSING_ERROR = "Currency no longer exists."
export const CURRENCY_DELETE_REASSIGN_REQUIRED_MESSAGE =
  "Every Coin has exactly one Face Value, so those Coins must be reassigned to another Currency before this Currency can be deleted."
export const CURRENCY_IN_USE_DELETE_ERROR =
  `Currency cannot be deleted while Coins still use it. ${CURRENCY_DELETE_REASSIGN_REQUIRED_MESSAGE}`
export const CURRENCY_INVALID_CODE_ERROR =
  "Currency Code must use lowercase letters, numbers, and hyphens only."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const DUPLICATE_CURRENCY_CODE_CONSTRAINT = "currency_code_lower_unique_idx"
const INVALID_CURRENCY_CODE_CONSTRAINT = "currency_code_slug_check"
const CURRENCY_IN_USE_DELETE_CONSTRAINT = "coin_currency_id_currency_id_fk"
const CURRENCY_FIELD_NAMES = ["code", "name", "fullName"] as const

const currencyCodeSchema = z
  .string()
  .trim()
  .min(1, "Currency Code cannot be blank.")
  .max(255, "Currency Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, CURRENCY_INVALID_CODE_ERROR)

const currencyNameSchema = z
  .string()
  .trim()
  .min(1, "Currency Name cannot be blank.")
  .max(255, "Currency Name must be 255 characters or fewer.")

const currencyFullNameSchema = z
  .string()
  .trim()
  .min(1, "Currency Full Name cannot be blank.")
  .max(255, "Currency Full Name must be 255 characters or fewer.")

export const createCurrencyInputSchema = z.object({
  code: currencyCodeSchema,
  name: currencyNameSchema,
  fullName: currencyFullNameSchema,
})

export const updateCurrencyInputSchema = createCurrencyInputSchema.extend({
  id: z.uuid(),
})

export const deleteCurrencyInputSchema = z.object({
  id: z.uuid(),
})

type CurrencyFieldName = (typeof CURRENCY_FIELD_NAMES)[number]

export type CurrencyFieldErrors = Partial<Record<CurrencyFieldName, string>>

export type CurrencyMutationResult =
  | {
      status: "error"
      fieldErrors: CurrencyFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type CurrencyAuthorizationErrorResult = {
  status: "error"
  formError: typeof CURRENCY_AUTHORIZATION_ERROR
}

type CreateCurrencyInput = z.input<typeof createCurrencyInputSchema>
type CreateCurrencyData = z.output<typeof createCurrencyInputSchema>
type UpdateCurrencyInput = z.input<typeof updateCurrencyInputSchema>
type UpdateCurrencyData = z.output<typeof updateCurrencyInputSchema>
type DeleteCurrencyInput = z.input<typeof deleteCurrencyInputSchema>
type DeleteCurrencyData = z.output<typeof deleteCurrencyInputSchema>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: CurrencyMutationResult }

type CurrencyMutationDependencies = {
  createCurrency: (input: CreateCurrencyData) => Promise<unknown>
  deleteCurrency: (input: DeleteCurrencyData) => Promise<unknown | null>
  updateCurrency: (input: UpdateCurrencyData) => Promise<unknown | null>
}

async function getDefaultCurrencyMutationDependencies(): Promise<CurrencyMutationDependencies> {
  const { createCurrency, deleteCurrency, updateCurrency } =
    await import("@workspace/db")

  return {
    createCurrency,
    deleteCurrency,
    updateCurrency,
  }
}

export function createCurrencyAuthorizationError(): CurrencyAuthorizationErrorResult {
  return {
    status: "error",
    formError: CURRENCY_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): CurrencyMutationResult {
  return {
    ...createCurrencyAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(
  fieldErrors: CurrencyFieldErrors
): CurrencyMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): CurrencyMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasCurrencyMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isCurrencyFieldName(field: unknown): field is CurrencyFieldName {
  return (
    typeof field === "string" &&
    CURRENCY_FIELD_NAMES.includes(field as CurrencyFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getCurrencyFieldErrors(
  issues: z.ZodIssue[]
): CurrencyFieldErrors {
  const fieldErrors: CurrencyFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isCurrencyFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): CurrencyMutationResult {
  return createFieldErrorResult(getCurrencyFieldErrors(issues))
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

function createPersistenceError(error: unknown): CurrencyMutationResult {
  if (
    matchesPostgresConstraint(
      error,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_CURRENCY_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: CURRENCY_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      error,
      FK_VIOLATION_POSTGRES_ERROR_CODE,
      CURRENCY_IN_USE_DELETE_CONSTRAINT
    )
  ) {
    return createFormErrorResult(CURRENCY_IN_USE_DELETE_ERROR)
  }

  if (
    matchesPostgresConstraint(
      error,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_CURRENCY_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: CURRENCY_INVALID_CODE_ERROR,
    })
  }

  return createFormErrorResult(CURRENCY_GENERIC_SAVE_ERROR)
}

function validateCurrencyInput<TSchema extends z.ZodType>(
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

function validateCreateCurrencyInput(
  input: CreateCurrencyInput
): ValidationResult<CreateCurrencyData> {
  return validateCurrencyInput(createCurrencyInputSchema, input)
}

function validateUpdateCurrencyInput(
  input: UpdateCurrencyInput
): ValidationResult<UpdateCurrencyData> {
  return validateCurrencyInput(updateCurrencyInputSchema, input)
}

function validateDeleteCurrencyInput(
  input: DeleteCurrencyInput
): ValidationResult<DeleteCurrencyData> {
  return validateCurrencyInput(deleteCurrencyInputSchema, input)
}

export async function submitCreateCurrency(
  collector: CollectorWithRole | null,
  input: CreateCurrencyInput,
  dependencies?: CurrencyMutationDependencies
): Promise<CurrencyMutationResult> {
  if (!hasCurrencyMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateCreateCurrencyInput(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCurrencyMutationDependencies())

  try {
    await resolvedDependencies.createCurrency(validationResult.data)

    return {
      status: "success",
      message: "Currency added.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitUpdateCurrency(
  collector: CollectorWithRole | null,
  input: UpdateCurrencyInput,
  dependencies?: CurrencyMutationDependencies
): Promise<CurrencyMutationResult> {
  if (!hasCurrencyMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateUpdateCurrencyInput(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCurrencyMutationDependencies())

  try {
    const updatedCurrency = await resolvedDependencies.updateCurrency(
      validationResult.data
    )

    if (updatedCurrency === null) {
      return createFormErrorResult(CURRENCY_MISSING_ERROR)
    }

    return {
      status: "success",
      message: "Saved.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitDeleteCurrency(
  collector: CollectorWithRole | null,
  input: DeleteCurrencyInput,
  dependencies?: CurrencyMutationDependencies
): Promise<CurrencyMutationResult> {
  if (!hasCurrencyMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateDeleteCurrencyInput(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCurrencyMutationDependencies())

  try {
    const deletedCurrency = await resolvedDependencies.deleteCurrency(
      validationResult.data
    )

    if (deletedCurrency === null) {
      return createFormErrorResult(CURRENCY_MISSING_ERROR)
    }

    return {
      status: "success",
      message: "Currency deleted.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}
