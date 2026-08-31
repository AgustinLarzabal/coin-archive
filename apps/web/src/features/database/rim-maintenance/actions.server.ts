import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapRimApiProblem } from "./actions"
import type { RimMutationResult } from "./rim-mutation-errors"
import {
  RIM_CREATED_MESSAGE,
  RIM_DELETED_MESSAGE,
  RIM_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateRimInput,
  DeleteRimInput,
  UpdateRimInput,
} from "./rim-validation"

type CreateRimDependencies = {
  createRim: MaintenanceApiClient["rims"]["create"]
}

type ReplaceRimDependencies = {
  replaceRim: MaintenanceApiClient["rims"]["replace"]
}

type DeleteRimDependencies = {
  deleteRim: MaintenanceApiClient["rims"]["delete"]
}

export async function submitCreateRim(
  input: CreateRimInput & { idempotencyKey: string },
  dependencies?: CreateRimDependencies
): Promise<RimMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { idempotencyKey, ...body } = input

  try {
    await (dependencies ?? { createRim: client!.rims.create }).createRim({
      headers: { "idempotency-key": idempotencyKey },
      body,
    })
    return { status: "success", message: RIM_CREATED_MESSAGE }
  } catch (error) {
    return mapRimApiProblem(error)
  }
}

export async function submitUpdateRim(
  input: UpdateRimInput,
  dependencies?: ReplaceRimDependencies
): Promise<RimMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = input

  try {
    await (dependencies ?? { replaceRim: client!.rims.replace }).replaceRim({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: RIM_UPDATED_MESSAGE }
  } catch (error) {
    return mapRimApiProblem(error)
  }
}

export async function submitDeleteRim(
  input: DeleteRimInput,
  dependencies?: DeleteRimDependencies
): Promise<RimMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (dependencies ?? { deleteRim: client!.rims.delete }).deleteRim({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: RIM_DELETED_MESSAGE }
  } catch (error) {
    return mapRimApiProblem(error)
  }
}
