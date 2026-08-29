import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapOrientationApiProblem } from "./actions"
import { createOrientationFieldErrorResult } from "./orientation-mutation-errors"
import type { OrientationMutationResult } from "./orientation-mutation-errors"
import {
  createOrientationInputSchema,
  deleteOrientationInputSchema,
  updateOrientationInputSchema,
  validateOrientationInput,
} from "./orientation-validation"
import type {
  CreateOrientationInput,
  DeleteOrientationInput,
  UpdateOrientationInput,
} from "./orientation-validation"

type CreateOrientationDependencies = {
  createOrientation: MaintenanceApiClient["orientations"]["create"]
}

type ReplaceOrientationDependencies = {
  replaceOrientation: MaintenanceApiClient["orientations"]["replace"]
}

type DeleteOrientationDependencies = {
  deleteOrientation: MaintenanceApiClient["orientations"]["delete"]
}

export async function submitCreateOrientation(
  input: CreateOrientationInput & { idempotencyKey: string },
  dependencies?: CreateOrientationDependencies
): Promise<OrientationMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { idempotencyKey, ...fields } = input
  const validation = validateOrientationInput(
    createOrientationInputSchema,
    fields
  )
  if (!validation.success) {
    return createOrientationFieldErrorResult(validation.fieldErrors)
  }

  try {
    await (
      dependencies ?? { createOrientation: client!.orientations.create }
    ).createOrientation({
      headers: { "idempotency-key": idempotencyKey },
      body: validation.data,
    })
    return { status: "success", message: "Orientation added." }
  } catch (error) {
    return mapOrientationApiProblem(error)
  }
}

export async function submitUpdateOrientation(
  input: UpdateOrientationInput,
  dependencies?: ReplaceOrientationDependencies
): Promise<OrientationMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const validation = validateOrientationInput(
    updateOrientationInputSchema,
    input
  )
  if (!validation.success) {
    return createOrientationFieldErrorResult(validation.fieldErrors)
  }
  const { id, etag, ...body } = validation.data

  try {
    await (
      dependencies ?? { replaceOrientation: client!.orientations.replace }
    ).replaceOrientation({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: "Saved." }
  } catch (error) {
    return mapOrientationApiProblem(error)
  }
}

export async function submitDeleteOrientation(
  input: DeleteOrientationInput,
  dependencies?: DeleteOrientationDependencies
): Promise<OrientationMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const validation = validateOrientationInput(
    deleteOrientationInputSchema,
    input
  )
  if (!validation.success) {
    return createOrientationFieldErrorResult(validation.fieldErrors)
  }

  try {
    await (
      dependencies ?? { deleteOrientation: client!.orientations.delete }
    ).deleteOrientation({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return { status: "success", message: "Orientation deleted." }
  } catch (error) {
    return mapOrientationApiProblem(error)
  }
}
