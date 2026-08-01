import { hasEditorAccess } from "@coin-archive/auth/client"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  CATALOGUE_MISSING_ERROR,
  createCatalogueFieldErrorResult,
  createCatalogueFormErrorResult,
  createCataloguePersistenceError,
} from "./catalogue-mutation-errors"
import type { CatalogueMutationResult } from "./catalogue-mutation-errors"
import {
  createCatalogueInputSchema,
  deleteCatalogueInputSchema,
  updateCatalogueInputSchema,
  validateCatalogueInput,
} from "./catalogue-validation"
import type {
  CreateCatalogueData,
  CreateCatalogueInput,
  DeleteCatalogueData,
  DeleteCatalogueInput,
  UpdateCatalogueData,
  UpdateCatalogueInput,
} from "./catalogue-validation"

export const CATALOGUE_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Catalogues."

export type CatalogueAuthorizationErrorResult = {
  status: "error"
  formError: typeof CATALOGUE_AUTHORIZATION_ERROR
}

type CatalogueMutationDependencies = {
  createCatalogue: (input: CreateCatalogueData) => Promise<unknown>
  deleteCatalogue: (input: DeleteCatalogueData) => Promise<unknown | null>
  updateCatalogue: (input: UpdateCatalogueData) => Promise<unknown | null>
}

async function getDefaultCatalogueMutationDependencies(): Promise<CatalogueMutationDependencies> {
  const { createCatalogue, deleteCatalogue, updateCatalogue } =
    await import("@coin-archive/db")

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

export function hasCatalogueMaintenanceAccess(
  collector: CollectorWithRole | null
) {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
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
    return createCatalogueFieldErrorResult(validationResult.fieldErrors)
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
    return createCataloguePersistenceError(error)
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
    return createCatalogueFieldErrorResult(validationResult.fieldErrors)
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCatalogueMutationDependencies())

  try {
    const updatedCatalogue = await resolvedDependencies.updateCatalogue(
      validationResult.data
    )

    if (updatedCatalogue === null) {
      return createCatalogueFormErrorResult(CATALOGUE_MISSING_ERROR)
    }

    return {
      status: "success",
      message: "Saved.",
    }
  } catch (error) {
    return createCataloguePersistenceError(error)
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
    return createCatalogueFieldErrorResult(validationResult.fieldErrors)
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCatalogueMutationDependencies())

  try {
    const deletedCatalogue = await resolvedDependencies.deleteCatalogue(
      validationResult.data
    )

    if (deletedCatalogue === null) {
      return createCatalogueFormErrorResult(CATALOGUE_MISSING_ERROR)
    }

    return {
      status: "success",
      message: "Catalogue deleted.",
    }
  } catch (error) {
    return createCataloguePersistenceError(error)
  }
}
