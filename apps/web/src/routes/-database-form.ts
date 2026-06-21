import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "../lib/collector-role"
import type { CollectorWithRole } from "../lib/collector-role"

export const CATALOGUE_AUTHORIZATION_ERROR =
  "You are not authorized to maintain Catalogues."
export const CATALOGUE_DUPLICATE_CODE_ERROR =
  "A Catalogue with this code already exists."
export const CATALOGUE_GENERIC_SAVE_ERROR =
  "Unable to save Catalogue right now."
export const CATALOGUE_MISSING_ERROR = "Catalogue no longer exists."

const catalogueCodeSchema = z
  .string()
  .trim()
  .min(1, "Catalogue Code cannot be blank")
  .max(255, "Catalogue Code must be 255 characters or fewer")

const catalogueTitleSchema = z
  .string()
  .trim()
  .min(1, "Catalogue Title cannot be blank")
  .max(255, "Catalogue Title must be 255 characters or fewer")

export const createCatalogueInputSchema = z.object({
  code: catalogueCodeSchema,
  title: catalogueTitleSchema,
})

export const updateCatalogueInputSchema = createCatalogueInputSchema.extend({
  id: z.uuid(),
})

export type CatalogueFieldErrors = Partial<Record<"code" | "title", string>>

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

type CreateCatalogueInput = z.input<typeof createCatalogueInputSchema>
type UpdateCatalogueInput = z.input<typeof updateCatalogueInputSchema>

type CatalogueMutationDependencies = {
  createCatalogue: (input: { code: string; title: string }) => Promise<unknown>
  updateCatalogue: (input: {
    id: string
    code: string
    title: string
  }) => Promise<unknown | null>
}

async function getDefaultCatalogueMutationDependencies(): Promise<CatalogueMutationDependencies> {
  const { createCatalogue, updateCatalogue } = await import("@workspace/db")

  return {
    createCatalogue,
    updateCatalogue,
  }
}

function createAuthorizationError(): CatalogueMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError: CATALOGUE_AUTHORIZATION_ERROR,
  }
}

function hasCatalogueMaintenanceAccess(collector: CollectorWithRole | null) {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

export function getCatalogueFieldErrors(
  issues: z.ZodIssue[]
): CatalogueFieldErrors {
  const fieldErrors: CatalogueFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (field === "code" || field === "title") {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function createValidationError(issues: z.ZodIssue[]): CatalogueMutationResult {
  return {
    status: "error",
    fieldErrors: getCatalogueFieldErrors(issues),
  }
}

function isDuplicateCatalogueCodeError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null &&
    "code" in error.cause &&
    error.cause.code === "23505" &&
    "constraint_name" in error.cause &&
    error.cause.constraint_name === "catalogue_code_lower_unique_idx"
  )
}

function createPersistenceError(error: unknown): CatalogueMutationResult {
  if (isDuplicateCatalogueCodeError(error)) {
    return {
      status: "error",
      fieldErrors: {
        code: CATALOGUE_DUPLICATE_CODE_ERROR,
      },
    }
  }

  return {
    status: "error",
    fieldErrors: {},
    formError: CATALOGUE_GENERIC_SAVE_ERROR,
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

  const parsedInput = createCatalogueInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return createValidationError(parsedInput.error.issues)
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCatalogueMutationDependencies())

  try {
    await resolvedDependencies.createCatalogue(parsedInput.data)

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

  const parsedInput = updateCatalogueInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return createValidationError(parsedInput.error.issues)
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCatalogueMutationDependencies())

  try {
    const updatedCatalogue = await resolvedDependencies.updateCatalogue(
      parsedInput.data
    )

    if (updatedCatalogue === null) {
      return {
        status: "error",
        fieldErrors: {},
        formError: CATALOGUE_MISSING_ERROR,
      }
    }

    return {
      status: "success",
      message: "Saved.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}
