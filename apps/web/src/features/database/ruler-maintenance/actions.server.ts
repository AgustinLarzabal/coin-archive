import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapRulerApiProblem } from "./actions"
import type { RulerMutationResult } from "./ruler-mutation-errors"
import {
  RULER_CREATED_MESSAGE,
  RULER_DELETED_MESSAGE,
  RULER_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateRulerInput,
  DeleteRulerInput,
  UpdateRulerInput,
} from "./ruler-validation"

type CreateRulerDependencies = {
  createRuler: MaintenanceApiClient["rulers"]["create"]
}

type ReplaceRulerDependencies = {
  replaceRuler: MaintenanceApiClient["rulers"]["replace"]
}

type DeleteRulerDependencies = {
  deleteRuler: MaintenanceApiClient["rulers"]["delete"]
}

export async function submitCreateRuler(
  input: CreateRulerInput & { idempotencyKey: string },
  dependencies?: CreateRulerDependencies
): Promise<RulerMutationResult> {
  const { idempotencyKey, ...fields } = input
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (dependencies ?? { createRuler: client!.rulers.create }).createRuler({
      headers: { "idempotency-key": idempotencyKey },
      body: fields,
    })
    return { status: "success", message: RULER_CREATED_MESSAGE }
  } catch (error) {
    return mapRulerApiProblem(error)
  }
}

export async function submitUpdateRuler(
  input: UpdateRulerInput,
  dependencies?: ReplaceRulerDependencies
): Promise<RulerMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = input

  try {
    await (
      dependencies ?? { replaceRuler: client!.rulers.replace }
    ).replaceRuler({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: RULER_UPDATED_MESSAGE }
  } catch (error) {
    return mapRulerApiProblem(error)
  }
}

export async function submitDeleteRuler(
  input: DeleteRulerInput,
  dependencies?: DeleteRulerDependencies
): Promise<RulerMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (dependencies ?? { deleteRuler: client!.rulers.delete }).deleteRuler({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: RULER_DELETED_MESSAGE }
  } catch (error) {
    return mapRulerApiProblem(error)
  }
}
