import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  CATALOGUE_DUPLICATE_CODE_ERROR,
  CATALOGUE_GENERIC_SAVE_ERROR,
  CATALOGUE_IN_USE_DELETE_ERROR,
  CATALOGUE_MISSING_ERROR,
  CATALOGUE_STALE_ERROR,
  createCatalogueFieldErrorResult,
  createCatalogueFormErrorResult,
} from "./catalogue-mutation-errors"
import type { CatalogueMutationResult } from "./catalogue-mutation-errors"
import {
  createCatalogueInputSchema,
  deleteCatalogueInputSchema,
  updateCatalogueInputSchema,
  validateCatalogueInput,
} from "./catalogue-validation"
import type {
  CreateCatalogueInput,
  DeleteCatalogueInput,
  UpdateCatalogueInput,
} from "./catalogue-validation"

export const CATALOGUE_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Catalogues."

export type CatalogueAuthorizationErrorResult = {
  status: "error"
  formError: typeof CATALOGUE_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createCatalogue: MaintenanceApiClient["catalogues"]["create"]
}

type ReplaceDependencies = {
  replaceCatalogue: MaintenanceApiClient["catalogues"]["replace"]
}

type DeleteDependencies = {
  deleteCatalogue: MaintenanceApiClient["catalogues"]["delete"]
}

export function createCatalogueAuthorizationError(): CatalogueAuthorizationErrorResult {
  return { status: "error", formError: CATALOGUE_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createCatalogue: client.catalogues.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceCatalogue: client.catalogues.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteCatalogue: client.catalogues.delete }
}

export async function submitCreateCatalogue(
  input: CreateCatalogueInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<CatalogueMutationResult> {
  const { idempotencyKey, ...fields } = input
  const validation = validateCatalogueInput(createCatalogueInputSchema, fields)
  if (!validation.success) {
    return createCatalogueFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createCatalogue({
      headers: { "idempotency-key": idempotencyKey },
      body: validation.data,
    })
    return { status: "success", message: "Catalogue added." }
  } catch (error) {
    return mapCatalogueApiProblem(error)
  }
}

export async function submitUpdateCatalogue(
  input: UpdateCatalogueInput,
  dependencies?: ReplaceDependencies
): Promise<CatalogueMutationResult> {
  const validation = validateCatalogueInput(updateCatalogueInputSchema, input)
  if (!validation.success) {
    return createCatalogueFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = validation.data

  try {
    await resolved.replaceCatalogue({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: "Saved." }
  } catch (error) {
    return mapCatalogueApiProblem(error)
  }
}

export async function submitDeleteCatalogue(
  input: DeleteCatalogueInput,
  dependencies?: DeleteDependencies
): Promise<CatalogueMutationResult> {
  const validation = validateCatalogueInput(deleteCatalogueInputSchema, input)
  if (!validation.success) {
    return createCatalogueFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteCatalogue({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return { status: "success", message: "Catalogue deleted." }
  } catch (error) {
    return mapCatalogueApiProblem(error)
  }
}

function mapCatalogueApiProblem(error: unknown): CatalogueMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createCatalogueFormErrorResult(CATALOGUE_AUTHORIZATION_ERROR)
    case "catalogue_code_conflict":
      return createCatalogueFieldErrorResult({
        code: CATALOGUE_DUPLICATE_CODE_ERROR,
      })
    case "catalogue_validation_failed":
      return mapValidationProblem(body)
    case "catalogue_in_use":
      return createCatalogueFormErrorResult(CATALOGUE_IN_USE_DELETE_ERROR)
    case "catalogue_not_found":
      return createCatalogueFormErrorResult(CATALOGUE_MISSING_ERROR)
    case "catalogue_precondition_failed":
      return createCatalogueFormErrorResult(CATALOGUE_STALE_ERROR)
    default:
      return createCatalogueFormErrorResult(CATALOGUE_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): CatalogueMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; title?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "catalogue_code_too_long"
          ? "Catalogue Code must be 255 characters or fewer."
          : "Catalogue Code cannot be blank."
    }
    if (parameter.name === "/title") {
      fieldErrors.title =
        parameter.code === "catalogue_title_too_long"
          ? "Catalogue Title must be 255 characters or fewer."
          : "Catalogue Title cannot be blank."
    }
  }
  return createCatalogueFieldErrorResult(fieldErrors)
}

function getProblemBody(error: unknown): Record<string, unknown> | undefined {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return undefined
  }
  const data = error.data
  if (typeof data !== "object" || data === null || !("body" in data)) {
    return undefined
  }
  return typeof data.body === "object" && data.body !== null
    ? (data.body as Record<string, unknown>)
    : undefined
}
