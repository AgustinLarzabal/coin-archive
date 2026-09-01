import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapEngraverApiProblem } from "./actions"
import type { EngraverMutationResult } from "./engraver-mutation-errors"
import {
  ENGRAVER_CREATED_MESSAGE,
  ENGRAVER_DELETED_MESSAGE,
  ENGRAVER_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateEngraverInput,
  DeleteEngraverInput,
  UpdateEngraverInput,
} from "./engraver-validation"

type CreateEngraverDependencies = {
  createEngraver: MaintenanceApiClient["engravers"]["create"]
}

type ReplaceEngraverDependencies = {
  replaceEngraver: MaintenanceApiClient["engravers"]["replace"]
}

type DeleteEngraverDependencies = {
  deleteEngraver: MaintenanceApiClient["engravers"]["delete"]
}

export async function submitCreateEngraver(
  input: CreateEngraverInput & { idempotencyKey: string },
  dependencies?: CreateEngraverDependencies
): Promise<EngraverMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { idempotencyKey, ...body } = input

  try {
    await (
      dependencies ?? { createEngraver: client!.engravers.create }
    ).createEngraver({
      headers: { "idempotency-key": idempotencyKey },
      body,
    })
    return { status: "success", message: ENGRAVER_CREATED_MESSAGE }
  } catch (error) {
    return mapEngraverApiProblem(error)
  }
}

export async function submitUpdateEngraver(
  input: UpdateEngraverInput,
  dependencies?: ReplaceEngraverDependencies
): Promise<EngraverMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = input

  try {
    await (
      dependencies ?? { replaceEngraver: client!.engravers.replace }
    ).replaceEngraver({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: ENGRAVER_UPDATED_MESSAGE }
  } catch (error) {
    return mapEngraverApiProblem(error)
  }
}

export async function submitDeleteEngraver(
  input: DeleteEngraverInput,
  dependencies?: DeleteEngraverDependencies
): Promise<EngraverMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (
      dependencies ?? { deleteEngraver: client!.engravers.delete }
    ).deleteEngraver({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: ENGRAVER_DELETED_MESSAGE }
  } catch (error) {
    return mapEngraverApiProblem(error)
  }
}
