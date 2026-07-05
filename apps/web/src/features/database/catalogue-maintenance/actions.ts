import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

export const CATALOGUE_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Catalogues."
export const CATALOGUE_DUPLICATE_CODE_ERROR =
  "A Catalogue with this code already exists."
export const CATALOGUE_GENERIC_SAVE_ERROR =
  "Unable to save Catalogue right now."
export const CATALOGUE_MISSING_ERROR = "Catalogue no longer exists."
export const CATALOGUE_IN_USE_DELETE_ERROR =
  "Catalogue cannot be deleted while coin references still use it."

const DUPLICATE_KEY_POSTGRES_ERROR_CODE = "23505"
const DUPLICATE_CATALOGUE_CODE_CONSTRAINT = "catalogue_code_lower_unique_idx"
const FK_VIOLATION_POSTGRES_ERROR_CODE = "23001"
const CATALOGUE_IN_USE_DELETE_CONSTRAINT =
  "coin_reference_catalogue_id_catalogue_id_fk"
const CATALOGUE_FIELD_NAMES = ["code", "title"] as const

const catalogueCodeSchema = z
  .string()
  .trim()
  .min(1, "Catalogue Code cannot be blank.")
  .max(255, "Catalogue Code must be 255 characters or fewer.")

const catalogueTitleSchema = z
  .string()
  .trim()
  .min(1, "Catalogue Title cannot be blank.")
  .max(255, "Catalogue Title must be 255 characters or fewer.")

export const createCatalogueInputSchema = z.object({
  code: catalogueCodeSchema,
  title: catalogueTitleSchema,
})

export const updateCatalogueInputSchema = createCatalogueInputSchema.extend({
  id: z.uuid(),
})

export const deleteCatalogueInputSchema = z.object({
  id: z.uuid(),
})

type CatalogueFieldName = (typeof CATALOGUE_FIELD_NAMES)[number]

export type CatalogueFieldErrors = Partial<Record<CatalogueFieldName, string>>

export type CatalogueMutationResult =
  | {
      status: "error"
      fieldErrors: CatalogueFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export type CatalogueAuthorizationErrorResult = {
  status: "error"
  formError: typeof CATALOGUE_AUTHORIZATION_ERROR
}

type CreateCatalogueInput = z.input<typeof createCatalogueInputSchema>
type UpdateCatalogueInput = z.input<typeof updateCatalogueInputSchema>
type DeleteCatalogueInput = z.input<typeof deleteCatalogueInputSchema>

type CatalogueMutationDependencies = {
  createCatalogue: (input: { code: string; title: string }) => Promise<unknown>
  deleteCatalogue: (input: { id: string }) => Promise<unknown | null>
  updateCatalogue: (input: {
    id: string
    code: string
    title: string
  }) => Promise<unknown | null>
}

async function getDefaultCatalogueMutationDependencies(): Promise<CatalogueMutationDependencies> {
  const { createCatalogue, deleteCatalogue, updateCatalogue } =
    await import("@workspace/db")

  return {
    createCatalogue,
    deleteCatalogue,
    updateCatalogue,
  }
}

export function createCatalogueAuthorizationError(): CatalogueAuthorizationErrorResult {
  return {
    status: "error",
    formError: CATALOGUE_AUTHORIZATION_ERROR,
  }
}

function createAuthorizationError(): CatalogueMutationResult {
  return {
    ...createCatalogueAuthorizationError(),
    fieldErrors: {},
  }
}

function createFieldErrorResult(
  fieldErrors: CatalogueFieldErrors
): CatalogueMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function createFormErrorResult(formError: string): CatalogueMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

export function hasCatalogueMaintenanceAccess(
  collector: CollectorWithRole | null
) {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isCatalogueFieldName(field: unknown): field is CatalogueFieldName {
  return (
    typeof field === "string" &&
    CATALOGUE_FIELD_NAMES.includes(field as CatalogueFieldName)
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getCatalogueFieldErrors(
  issues: z.ZodIssue[]
): CatalogueFieldErrors {
  const fieldErrors: CatalogueFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isCatalogueFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): CatalogueMutationResult {
  return createFieldErrorResult(getCatalogueFieldErrors(issues))
}

function isDuplicateCatalogueCodeError(error: unknown) {
  if (!isObjectRecord(error)) {
    return false
  }

  const postgresError = "cause" in error ? error.cause : error

  if (!isObjectRecord(postgresError)) {
    return false
  }

  return (
    "code" in postgresError &&
    postgresError.code === DUPLICATE_KEY_POSTGRES_ERROR_CODE &&
    "constraint_name" in postgresError &&
    postgresError.constraint_name === DUPLICATE_CATALOGUE_CODE_CONSTRAINT
  )
}

function isCatalogueInUseDeleteError(error: unknown) {
  if (!isObjectRecord(error)) {
    return false
  }

  const postgresError = "cause" in error ? error.cause : error

  if (!isObjectRecord(postgresError)) {
    return false
  }

  return (
    "code" in postgresError &&
    postgresError.code === FK_VIOLATION_POSTGRES_ERROR_CODE &&
    "constraint_name" in postgresError &&
    postgresError.constraint_name === CATALOGUE_IN_USE_DELETE_CONSTRAINT
  )
}

function createPersistenceError(error: unknown): CatalogueMutationResult {
  if (isDuplicateCatalogueCodeError(error)) {
    return createFieldErrorResult({
      code: CATALOGUE_DUPLICATE_CODE_ERROR,
    })
  }

  if (isCatalogueInUseDeleteError(error)) {
    return createFormErrorResult(CATALOGUE_IN_USE_DELETE_ERROR)
  }

  return createFormErrorResult(CATALOGUE_GENERIC_SAVE_ERROR)
}

function validateCatalogueInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
):
  | { success: true; data: z.output<TSchema> }
  | { success: false; result: CatalogueMutationResult } {
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

export async function submitCreateCatalogue(
  collector: CollectorWithRole | null,
  input: CreateCatalogueInput,
  dependencies?: CatalogueMutationDependencies
): Promise<CatalogueMutationResult> {
  if (!hasCatalogueMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateCatalogueInput(
    createCatalogueInputSchema,
    input
  )

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCatalogueMutationDependencies())

  try {
    await resolvedDependencies.createCatalogue(validationResult.data)

    return {
      status: "success",
      message: "Catalogue added.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitUpdateCatalogue(
  collector: CollectorWithRole | null,
  input: UpdateCatalogueInput,
  dependencies?: CatalogueMutationDependencies
): Promise<CatalogueMutationResult> {
  if (!hasCatalogueMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateCatalogueInput(
    updateCatalogueInputSchema,
    input
  )

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCatalogueMutationDependencies())

  try {
    const updatedCatalogue = await resolvedDependencies.updateCatalogue(
      validationResult.data
    )

    if (updatedCatalogue === null) {
      return createFormErrorResult(CATALOGUE_MISSING_ERROR)
    }

    return {
      status: "success",
      message: "Saved.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitDeleteCatalogue(
  collector: CollectorWithRole | null,
  input: DeleteCatalogueInput,
  dependencies?: CatalogueMutationDependencies
): Promise<CatalogueMutationResult> {
  if (!hasCatalogueMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateCatalogueInput(
    deleteCatalogueInputSchema,
    input
  )

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCatalogueMutationDependencies())

  try {
    const deletedCatalogue = await resolvedDependencies.deleteCatalogue(
      validationResult.data
    )

    if (deletedCatalogue === null) {
      return createFormErrorResult(CATALOGUE_MISSING_ERROR)
    }

    return {
      status: "success",
      message: "Catalogue deleted.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}
