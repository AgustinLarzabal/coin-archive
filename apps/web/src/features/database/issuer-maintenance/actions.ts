import { hasEditorAccess } from "@coin-archive/auth/client"
import type { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  ISSUER_AUTHORIZATION_ERROR,
  ISSUER_CHILDREN_DELETE_ERROR,
  ISSUER_COINS_DELETE_ERROR,
  ISSUER_CREATED_MESSAGE,
  ISSUER_CYCLIC_PARENT_ERROR,
  ISSUER_DELETED_MESSAGE,
  ISSUER_DUPLICATE_CODE_ERROR,
  ISSUER_GENERIC_SAVE_ERROR,
  ISSUER_INVALID_CODE_ERROR,
  ISSUER_INVALID_ISO_CODE_ERROR,
  ISSUER_MISSING_ERROR,
  ISSUER_MISSING_PARENT_ERROR,
  ISSUER_SELF_PARENT_ERROR,
  ISSUER_UPDATED_MESSAGE,
} from "./messages"
import {
  createIssuerInputSchema,
  deleteIssuerInputSchema,
  getIssuerFieldErrors,
  updateIssuerInputSchema,
} from "./validation"
import type { IssuerFieldErrors } from "./validation"

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
    await import("@coin-archive/db")

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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isPostgresError(value: unknown): value is PostgresError {
  return isObjectRecord(value) && "code" in value && "constraint_name" in value
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
  postgresError: PostgresError,
  code: string,
  constraintName: string
): boolean {
  return (
    postgresError.code === code &&
    postgresError.constraint_name === constraintName
  )
}

function createPersistenceError(error: unknown): IssuerMutationResult {
  const postgresError = getPostgresError(error)

  if (postgresError === null) {
    return createFormErrorResult(ISSUER_GENERIC_SAVE_ERROR)
  }

  for (const entry of POSTGRES_CONSTRAINT_RESULTS) {
    if (
      matchesPostgresConstraint(postgresError, entry.code, entry.constraintName)
    ) {
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
      message: ISSUER_CREATED_MESSAGE,
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
      message: ISSUER_UPDATED_MESSAGE,
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
      message: ISSUER_DELETED_MESSAGE,
    }),
    createNullResult: () => createFormErrorResult(ISSUER_MISSING_ERROR),
  })
}
