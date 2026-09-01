import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapRulerGroupApiProblem } from "./actions"
import type { RulerGroupMutationResult } from "./ruler-group-mutation-errors"
import {
  RULER_GROUP_CREATED_MESSAGE,
  RULER_GROUP_DELETED_MESSAGE,
  RULER_GROUP_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateRulerGroupInput,
  DeleteRulerGroupInput,
  UpdateRulerGroupInput,
} from "./ruler-group-validation"

type CreateRulerGroupDependencies = {
  createRulerGroup: MaintenanceApiClient["rulerGroups"]["create"]
}

type ReplaceRulerGroupDependencies = {
  replaceRulerGroup: MaintenanceApiClient["rulerGroups"]["replace"]
}

type DeleteRulerGroupDependencies = {
  deleteRulerGroup: MaintenanceApiClient["rulerGroups"]["delete"]
}

export async function submitCreateRulerGroup(
  input: CreateRulerGroupInput & { idempotencyKey: string },
  dependencies?: CreateRulerGroupDependencies
): Promise<RulerGroupMutationResult> {
  const { idempotencyKey, ...fields } = input
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (
      dependencies ?? { createRulerGroup: client!.rulerGroups.create }
    ).createRulerGroup({
      headers: { "idempotency-key": idempotencyKey },
      body: fields,
    })
    return { status: "success", message: RULER_GROUP_CREATED_MESSAGE }
  } catch (error) {
    return mapRulerGroupApiProblem(error)
  }
}

export async function submitUpdateRulerGroup(
  input: UpdateRulerGroupInput,
  dependencies?: ReplaceRulerGroupDependencies
): Promise<RulerGroupMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = input

  try {
    await (
      dependencies ?? { replaceRulerGroup: client!.rulerGroups.replace }
    ).replaceRulerGroup({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: RULER_GROUP_UPDATED_MESSAGE }
  } catch (error) {
    return mapRulerGroupApiProblem(error)
  }
}

export async function submitDeleteRulerGroup(
  input: DeleteRulerGroupInput,
  dependencies?: DeleteRulerGroupDependencies
): Promise<RulerGroupMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (
      dependencies ?? { deleteRulerGroup: client!.rulerGroups.delete }
    ).deleteRulerGroup({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: RULER_GROUP_DELETED_MESSAGE }
  } catch (error) {
    return mapRulerGroupApiProblem(error)
  }
}
