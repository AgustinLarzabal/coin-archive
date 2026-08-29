import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapCatalogueApiProblem } from "./actions"
import { createCatalogueFieldErrorResult } from "./catalogue-mutation-errors"
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

type CreateCatalogueDependencies = {
  createCatalogue: MaintenanceApiClient["catalogues"]["create"]
}

type ReplaceCatalogueDependencies = {
  replaceCatalogue: MaintenanceApiClient["catalogues"]["replace"]
}

type DeleteCatalogueDependencies = {
  deleteCatalogue: MaintenanceApiClient["catalogues"]["delete"]
}

export async function submitCreateCatalogue(
  input: CreateCatalogueInput & { idempotencyKey: string },
  dependencies?: CreateCatalogueDependencies
): Promise<CatalogueMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { idempotencyKey, ...fields } = input
  const validation = validateCatalogueInput(createCatalogueInputSchema, fields)
  if (!validation.success) {
    return createCatalogueFieldErrorResult(validation.fieldErrors)
  }

  try {
    await (
      dependencies ?? { createCatalogue: client!.catalogues.create }
    ).createCatalogue({
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
  dependencies?: ReplaceCatalogueDependencies
): Promise<CatalogueMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const validation = validateCatalogueInput(updateCatalogueInputSchema, input)
  if (!validation.success) {
    return createCatalogueFieldErrorResult(validation.fieldErrors)
  }
  const { id, etag, ...body } = validation.data

  try {
    await (
      dependencies ?? { replaceCatalogue: client!.catalogues.replace }
    ).replaceCatalogue({
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
  dependencies?: DeleteCatalogueDependencies
): Promise<CatalogueMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const validation = validateCatalogueInput(deleteCatalogueInputSchema, input)
  if (!validation.success) {
    return createCatalogueFieldErrorResult(validation.fieldErrors)
  }

  try {
    await (
      dependencies ?? { deleteCatalogue: client!.catalogues.delete }
    ).deleteCatalogue({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return { status: "success", message: "Catalogue deleted." }
  } catch (error) {
    return mapCatalogueApiProblem(error)
  }
}
