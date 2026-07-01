import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const ISSUER_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Issuers."
export const ISSUER_DUPLICATE_CODE_ERROR =
  "An Issuer with this code already exists."
export const ISSUER_GENERIC_SAVE_ERROR = "Unable to save Issuer right now."
export const ISSUER_INVALID_CODE_ERROR =
  "Issuer Code must use lowercase letters, numbers, and hyphens only."
export const ISSUER_INVALID_ISO_CODE_ERROR =
  "Issuer ISO Code must be exactly two uppercase letters."
export const ISSUER_INVALID_PARENT_ERROR =
  "Selected Parent Issuer no longer exists."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const FOREIGN_KEY_VIOLATION_POSTGRES_ERROR_CODE = "23503"
const DUPLICATE_ISSUER_CODE_CONSTRAINT = "issuer_code_unique_idx"
const INVALID_ISSUER_CODE_CONSTRAINT = "issuer_code_slug_check"
const INVALID_ISSUER_ISO_CODE_CONSTRAINT = "issuer_iso_code_format_check"
const INVALID_PARENT_ISSUER_CONSTRAINT = "issuer_parent_issuer_id_issuer_id_fk"
const ISSUER_FIELD_NAMES = [
  "code",
  "name",
  "isoCode",
  "parentIssuerId",
] as const

const issuerCodeSchema = z
  .string()
  .trim()
  .min(1, "Issuer Code cannot be blank.")
  .max(255, "Issuer Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, ISSUER_INVALID_CODE_ERROR)

const issuerNameSchema = z
  .string()
  .trim()
  .min(1, "Issuer Name cannot be blank.")
  .max(255, "Issuer Name must be 255 characters or fewer.")

const issuerIsoCodeSchema = z
  .string()
  .trim()
  .min(1, "Issuer ISO Code cannot be blank.")
  .max(2, ISSUER_INVALID_ISO_CODE_ERROR)
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{2}$/, ISSUER_INVALID_ISO_CODE_ERROR))

const parentIssuerIdSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value
  }

  const normalizedValue = value.trim()
  return normalizedValue === "" ? undefined : normalizedValue
}, z.string().uuid("Parent Issuer must be a valid record.").optional())

export const createIssuerInputSchema = z.object({
  code: issuerCodeSchema,
  name: issuerNameSchema,
  isoCode: issuerIsoCodeSchema,
  parentIssuerId: parentIssuerIdSchema,
})

type IssuerFieldName = (typeof ISSUER_FIELD_NAMES)[number]

export type IssuerFieldErrors = Partial<Record<IssuerFieldName, string>>

export type IssuerMutationResult =
  | {
      status: "error"
      fieldErrors: IssuerFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

type CreateIssuerInput = z.input<typeof createIssuerInputSchema>
type CreateIssuerData = z.output<typeof createIssuerInputSchema>

type IssuerMutationDependencies = {
  createIssuer: (input: CreateIssuerData) => Promise<unknown>
}

type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: IssuerMutationResult }

async function getDefaultIssuerMutationDependencies(): Promise<IssuerMutationDependencies> {
  const { createIssuer } = await import("@workspace/db")

  return {
    createIssuer,
  }
}

function createAuthorizationError(): IssuerMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError: ISSUER_AUTHORIZATION_ERROR,
  }
}

function createFieldErrorResult(
  fieldErrors: IssuerFieldErrors
): IssuerMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): IssuerMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasIssuerMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isIssuerFieldName(field: unknown): field is IssuerFieldName {
  return (
    typeof field === "string" &&
    ISSUER_FIELD_NAMES.includes(field as IssuerFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getIssuerFieldErrors(issues: z.ZodIssue[]): IssuerFieldErrors {
  const fieldErrors: IssuerFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isIssuerFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): IssuerMutationResult {
  return createFieldErrorResult(getIssuerFieldErrors(issues))
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
  postgresError: Record<string, unknown> | null,
  code: string,
  constraintName: string
) {
  return (
    postgresError !== null &&
    "code" in postgresError &&
    postgresError.code === code &&
    "constraint_name" in postgresError &&
    postgresError.constraint_name === constraintName
  )
}

function createPersistenceError(error: unknown): IssuerMutationResult {
  const postgresError = getPostgresError(error)

  if (
    matchesPostgresConstraint(
      postgresError,
      DUPLICATE_KEY_POSTGRES_ERROR_CODE,
      DUPLICATE_ISSUER_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: ISSUER_DUPLICATE_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      postgresError,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_ISSUER_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      code: ISSUER_INVALID_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      postgresError,
      CHECK_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_ISSUER_ISO_CODE_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      isoCode: ISSUER_INVALID_ISO_CODE_ERROR,
    })
  }

  if (
    matchesPostgresConstraint(
      postgresError,
      FOREIGN_KEY_VIOLATION_POSTGRES_ERROR_CODE,
      INVALID_PARENT_ISSUER_CONSTRAINT
    )
  ) {
    return createFieldErrorResult({
      parentIssuerId: ISSUER_INVALID_PARENT_ERROR,
    })
  }

  return createFormErrorResult(ISSUER_GENERIC_SAVE_ERROR)
}

function validateIssuerInput<TSchema extends z.ZodType>(
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

export async function submitCreateIssuer(
  collector: CollectorWithRole | null,
  input: CreateIssuerInput,
  dependencies?: IssuerMutationDependencies
): Promise<IssuerMutationResult> {
  if (!hasIssuerMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateIssuerInput(createIssuerInputSchema, input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultIssuerMutationDependencies())

  try {
    await resolvedDependencies.createIssuer(validationResult.data)

    return {
      status: "success",
      message: "Issuer added.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}
