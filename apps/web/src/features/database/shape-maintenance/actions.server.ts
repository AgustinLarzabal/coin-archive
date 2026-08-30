import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapShapeApiProblem } from "./actions"
import type { ShapeMutationResult } from "./shape-mutation-errors"
import {
  SHAPE_CREATED_MESSAGE,
  SHAPE_DELETED_MESSAGE,
  SHAPE_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateShapeInput,
  DeleteShapeInput,
  UpdateShapeInput,
} from "./shape-validation"

type CreateShapeDependencies = {
  createShape: MaintenanceApiClient["shapes"]["create"]
}

type ReplaceShapeDependencies = {
  replaceShape: MaintenanceApiClient["shapes"]["replace"]
}

type DeleteShapeDependencies = {
  deleteShape: MaintenanceApiClient["shapes"]["delete"]
}

export async function submitCreateShape(
  input: CreateShapeInput & { idempotencyKey: string },
  dependencies?: CreateShapeDependencies
): Promise<ShapeMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { idempotencyKey, ...body } = input

  try {
    await (dependencies ?? { createShape: client!.shapes.create }).createShape({
      headers: { "idempotency-key": idempotencyKey },
      body,
    })
    return { status: "success", message: SHAPE_CREATED_MESSAGE }
  } catch (error) {
    return mapShapeApiProblem(error)
  }
}

export async function submitUpdateShape(
  input: UpdateShapeInput,
  dependencies?: ReplaceShapeDependencies
): Promise<ShapeMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = input

  try {
    await (
      dependencies ?? { replaceShape: client!.shapes.replace }
    ).replaceShape({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: SHAPE_UPDATED_MESSAGE }
  } catch (error) {
    return mapShapeApiProblem(error)
  }
}

export async function submitDeleteShape(
  input: DeleteShapeInput,
  dependencies?: DeleteShapeDependencies
): Promise<ShapeMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (dependencies ?? { deleteShape: client!.shapes.delete }).deleteShape({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: SHAPE_DELETED_MESSAGE }
  } catch (error) {
    return mapShapeApiProblem(error)
  }
}
