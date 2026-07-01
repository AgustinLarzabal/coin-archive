import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const ISSUER_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Issuers."
export const ISSUER_DUPLICATE_CODE_ERROR =
  "An Issuer with this code already exists."
export const ISSUER_GENERIC_SAVE_ERROR = "Unable to save Issuer right now."
export const ISSUER_MISSING_ERROR = "Issuer no longer exists."
export const ISSUER_INVALID_CODE_ERROR =
  "Issuer Code must use lowercase letters, numbers, and hyphens only."
export const ISSUER_INVALID_ISO_CODE_ERROR =
  "Issuer ISO Code must be a two-letter ISO 3166-1 alpha-2 code."
export const ISSUER_MISSING_PARENT_ERROR =
  "Selected Parent Issuer no longer exists."
export const ISSUER_SELF_PARENT_ERROR =
  "Issuer cannot be its own Parent Issuer."
export const ISSUER_CYCLIC_PARENT_ERROR =
  "Parent Issuer cannot be a descendant of this Issuer."
export const ISSUER_COINS_DELETE_ERROR =
  "Issuer cannot be deleted while Coins still use it. Remove or reassign the Issuer on those Coins before deleting it."
export const ISSUER_CHILDREN_DELETE_ERROR =
  "Issuer cannot be deleted while child Issuers still reference it. Reassign or remove those child Issuers before deleting this Issuer."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const FK_REFERENCE_POSTGRES_ERROR_CODE = "23503"
const CHECK_VIOLATION_POSTGRES_ERROR_CODE = "23514"
const DUPLICATE_ISSUER_CODE_CONSTRAINT = "issuer_code_unique_idx"
const INVALID_ISSUER_CODE_CONSTRAINT = "issuer_code_slug_check"
const INVALID_ISSUER_ISO_CODE_CONSTRAINT = "issuer_iso_code_format_check"
const MISSING_PARENT_ISSUER_CONSTRAINT = "issuer_parent_issuer_id_issuer_id_fk"
const SELF_PARENT_ISSUER_CONSTRAINT = "issuer_parent_issuer_id_self_check"
const CYCLIC_PARENT_ISSUER_CONSTRAINT = "issuer_parent_issuer_id_cycle_check"
const COIN_ISSUER_DELETE_CONSTRAINT = "coin_issuer_id_issuer_id_fk"
const CHILD_ISSUER_DELETE_CONSTRAINT = "issuer_parent_issuer_id_issuer_id_fk"
const ISSUER_FIELD_NAMES = [
  "code",
  "isoCode",
  "name",
  "parentIssuerId",
] as const

const issuerCodeSchema = z
  .string()
  .trim()
  .min(1, "Issuer Code cannot be blank.")
  .max(255, "Issuer Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, ISSUER_INVALID_CODE_ERROR)

const issuerIsoCodeSchema = z
  .string()
  .trim()
  .min(1, "Issuer ISO Code cannot be blank.")
  .max(2, ISSUER_INVALID_ISO_CODE_ERROR)
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z]{2}$/.test(value), ISSUER_INVALID_ISO_CODE_ERROR)

const issuerNameSchema = z
  .string()
  .trim()
  .min(1, "Issuer Name cannot be blank.")
  .max(255, "Issuer Name must be 255 characters or fewer.")

const issuerParentIssuerIdSchema = z
  .string()
  .uuid("Parent Issuer must be a valid record.")
  .nullable()

export const createIssuerInputSchema = z.object({
  code: issuerCodeSchema,
  isoCode: issuerIsoCodeSchema,
  name: issuerNameSchema,
  parentIssuerId: issuerParentIssuerIdSchema,
})

export const updateIssuerInputSchema = createIssuerInputSchema.extend({
  id: z.uuid(),
})

export const deleteIssuerInputSchema = z.object({
  id: z.uuid(),
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
type UpdateIssuerInput = z.input<typeof updateIssuerInputSchema>
type UpdateIssuerData = z.output<typeof updateIssuerInputSchema>
type DeleteIssuerInput = z.input<typeof deleteIssuerInputSchema>
type DeleteIssuerData = z.output<typeof deleteIssuerInputSchema>
type ValidationResult<TData> =
  | { success: true; data: TData }
  | { success: false; result: IssuerMutationResult }
type PostgresConstraintResult = {
  code: string
  constraintName: string
  result: IssuerMutationResult
}
type PostgresError = {
  code: unknown
  constraint_name: unknown
}

type SubmitIssuerMutationOptions<TInput, TData> = {
  collector: CollectorWithRole | null
  input: TInput
  dependencies?: IssuerMutationDependencies
  validate: (input: TInput) => ValidationResult<TData>
  execute: (
    dependencies: IssuerMutationDependencies,
    data: TData
  ) => Promise<unknown | null>
  createSuccessResult: () => IssuerMutationResult
  createNullResult?: () => IssuerMutationResult
}

type IssuerMutationDependencies = {
  createIssuer: (input: CreateIssuerData) => Promise<unknown>
  deleteIssuer: (input: DeleteIssuerData) => Promise<unknown | null>
  updateIssuer: (input: UpdateIssuerData) => Promise<unknown | null>
}

const POSTGRES_CONSTRAINT_RESULTS: PostgresConstraintResult[] = [
  {
    code: DUPLICATE_KEY_POSTGRES_ERROR_CODE,
    constraintName: DUPLICATE_ISSUER_CODE_CONSTRAINT,
    result: createFieldErrorResult({
      code: ISSUER_DUPLICATE_CODE_ERROR,
    }),
  },
  {
    code: FK_VIOLATION_POSTGRES_ERROR_CODE,
    constraintName: COIN_ISSUER_DELETE_CONSTRAINT,
    result: createFormErrorResult(ISSUER_COINS_DELETE_ERROR),
  },
  {
    code: FK_VIOLATION_POSTGRES_ERROR_CODE,
    constraintName: CHILD_ISSUER_DELETE_CONSTRAINT,
    result: createFormErrorResult(ISSUER_CHILDREN_DELETE_ERROR),
  },
  {
    code: CHECK_VIOLATION_POSTGRES_ERROR_CODE,
    constraintName: INVALID_ISSUER_CODE_CONSTRAINT,
    result: createFieldErrorResult({
      code: ISSUER_INVALID_CODE_ERROR,
    }),
  },
  {
    code: CHECK_VIOLATION_POSTGRES_ERROR_CODE,
    constraintName: INVALID_ISSUER_ISO_CODE_CONSTRAINT,
    result: createFieldErrorResult({
      isoCode: ISSUER_INVALID_ISO_CODE_ERROR,
    }),
  },
  {
    code: FK_REFERENCE_POSTGRES_ERROR_CODE,
    constraintName: MISSING_PARENT_ISSUER_CONSTRAINT,
    result: createFieldErrorResult({
      parentIssuerId: ISSUER_MISSING_PARENT_ERROR,
    }),
  },
  {
    code: CHECK_VIOLATION_POSTGRES_ERROR_CODE,
    constraintName: SELF_PARENT_ISSUER_CONSTRAINT,
    result: createFieldErrorResult({
      parentIssuerId: ISSUER_SELF_PARENT_ERROR,
    }),
  },
  {
    code: CHECK_VIOLATION_POSTGRES_ERROR_CODE,
    constraintName: CYCLIC_PARENT_ISSUER_CONSTRAINT,
    result: createFieldErrorResult({
      parentIssuerId: ISSUER_CYCLIC_PARENT_ERROR,
    }),
  },
]

async function getDefaultIssuerMutationDependencies(): Promise<IssuerMutationDependencies> {
  const { createIssuer, deleteIssuer, updateIssuer } =
    await import("@workspace/db")

  return {
    createIssuer,
    deleteIssuer,
    updateIssuer,
  }
}

async function resolveIssuerMutationDependencies(
  dependencies?: IssuerMutationDependencies
): Promise<IssuerMutationDependencies> {
  return dependencies ?? getDefaultIssuerMutationDependencies()
}

function createAuthorizationError(): IssuerMutationResult {
  return createFormErrorResult(ISSUER_AUTHORIZATION_ERROR)
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

function isPostgresError(value: unknown): value is PostgresError {
  return isObjectRecord(value) && "code" in value && "constraint_name" in value
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
  error: unknown,
  code: string,
  constraintName: string
): boolean {
  const postgresError = getPostgresError(error)

  return (
    postgresError !== null &&
    postgresError.code === code &&
    postgresError.constraint_name === constraintName
  )
}

function createPersistenceError(error: unknown): IssuerMutationResult {
  for (const entry of POSTGRES_CONSTRAINT_RESULTS) {
    if (matchesPostgresConstraint(error, entry.code, entry.constraintName)) {
      return entry.result
    }
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

function validateCreateIssuerInput(
  input: CreateIssuerInput
): ValidationResult<CreateIssuerData> {
  return validateIssuerInput(createIssuerInputSchema, input)
}

function validateUpdateIssuerInput(
  input: UpdateIssuerInput
): ValidationResult<UpdateIssuerData> {
  return validateIssuerInput(updateIssuerInputSchema, input)
}

function validateDeleteIssuerInput(
  input: DeleteIssuerInput
): ValidationResult<DeleteIssuerData> {
  return validateIssuerInput(deleteIssuerInputSchema, input)
}

async function submitIssuerMutation<TInput, TData>({
  collector,
  input,
  dependencies,
  validate,
  execute,
  createSuccessResult,
  createNullResult,
}: SubmitIssuerMutationOptions<TInput, TData>): Promise<IssuerMutationResult> {
  if (!hasIssuerMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validate(input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    await resolveIssuerMutationDependencies(dependencies)

  try {
    const result = await execute(resolvedDependencies, validationResult.data)

    if (result === null && createNullResult) {
      return createNullResult()
    }

    return createSuccessResult()
  } catch (error) {
    return createPersistenceError(error)
  }
}

export function submitCreateIssuer(
  collector: CollectorWithRole | null,
  input: CreateIssuerInput,
  dependencies?: IssuerMutationDependencies
) {
  return submitIssuerMutation({
    collector,
    input,
    dependencies,
    validate: validateCreateIssuerInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.createIssuer(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Issuer added.",
    }),
  })
}

export function submitUpdateIssuer(
  collector: CollectorWithRole | null,
  input: UpdateIssuerInput,
  dependencies?: IssuerMutationDependencies
) {
  return submitIssuerMutation({
    collector,
    input,
    dependencies,
    validate: validateUpdateIssuerInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.updateIssuer(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Saved.",
    }),
    createNullResult: () => createFormErrorResult(ISSUER_MISSING_ERROR),
  })
}

export function submitDeleteIssuer(
  collector: CollectorWithRole | null,
  input: DeleteIssuerInput,
  dependencies?: IssuerMutationDependencies
) {
  return submitIssuerMutation({
    collector,
    input,
    dependencies,
    validate: validateDeleteIssuerInput,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.deleteIssuer(data),
    createSuccessResult: () => ({
      status: "success",
      message: "Issuer deleted.",
    }),
    createNullResult: () => createFormErrorResult(ISSUER_MISSING_ERROR),
  })
}
