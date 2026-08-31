import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapEdgeApiProblem } from "./actions"
import {
  createEdgeFieldErrorResult,
  type EdgeMutationResult,
} from "./edge-mutation-errors"
import {
  EDGE_CREATED_MESSAGE,
  EDGE_DELETED_MESSAGE,
  EDGE_UPDATED_MESSAGE,
} from "./messages"
import {
  createEdgeInputSchema,
  deleteEdgeInputSchema,
  updateEdgeInputSchema,
  validateEdgeInput,
} from "./edge-validation"
import type {
  CreateEdgeInput,
  DeleteEdgeInput,
  UpdateEdgeInput,
} from "./edge-validation"

type CreateEdgeDependencies = {
  createEdge: MaintenanceApiClient["edges"]["create"]
}

type ReplaceEdgeDependencies = {
  replaceEdge: MaintenanceApiClient["edges"]["replace"]
}

type DeleteEdgeDependencies = {
  deleteEdge: MaintenanceApiClient["edges"]["delete"]
}

export async function submitCreateEdge(
  input: CreateEdgeInput & { idempotencyKey: string },
  dependencies?: CreateEdgeDependencies
): Promise<EdgeMutationResult> {
  const { idempotencyKey, ...fields } = input
  const validation = validateEdgeInput(createEdgeInputSchema, fields)
  if (!validation.success)
    return createEdgeFieldErrorResult(validation.fieldErrors)
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (dependencies ?? { createEdge: client!.edges.create }).createEdge({
      headers: { "idempotency-key": idempotencyKey },
      body: validation.data,
    })
    return { status: "success", message: EDGE_CREATED_MESSAGE }
  } catch (error) {
    return mapEdgeApiProblem(error)
  }
}

export async function submitUpdateEdge(
  input: UpdateEdgeInput,
  dependencies?: ReplaceEdgeDependencies
): Promise<EdgeMutationResult> {
  const validation = validateEdgeInput(updateEdgeInputSchema, input)
  if (!validation.success)
    return createEdgeFieldErrorResult(validation.fieldErrors)
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = validation.data

  try {
    await (dependencies ?? { replaceEdge: client!.edges.replace }).replaceEdge({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: EDGE_UPDATED_MESSAGE }
  } catch (error) {
    return mapEdgeApiProblem(error)
  }
}

export async function submitDeleteEdge(
  input: DeleteEdgeInput,
  dependencies?: DeleteEdgeDependencies
): Promise<EdgeMutationResult> {
  const validation = validateEdgeInput(deleteEdgeInputSchema, input)
  if (!validation.success)
    return createEdgeFieldErrorResult(validation.fieldErrors)
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (dependencies ?? { deleteEdge: client!.edges.delete }).deleteEdge({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return { status: "success", message: EDGE_DELETED_MESSAGE }
  } catch (error) {
    return mapEdgeApiProblem(error)
  }
}
