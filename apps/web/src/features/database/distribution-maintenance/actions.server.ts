import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapDistributionApiProblem } from "./actions"
import { createDistributionFieldErrorResult } from "./distribution-mutation-errors"
import type { DistributionMutationResult } from "./distribution-mutation-errors"
import {
  DISTRIBUTION_CREATED_MESSAGE,
  DISTRIBUTION_DELETED_MESSAGE,
  DISTRIBUTION_UPDATED_MESSAGE,
} from "./messages"
import {
  createDistributionInputSchema,
  deleteDistributionInputSchema,
  updateDistributionInputSchema,
  validateDistributionInput,
} from "./validation"
import type {
  CreateDistributionInput,
  DeleteDistributionInput,
  UpdateDistributionInput,
} from "./validation"

type CreateDistributionDependencies = {
  createDistribution: MaintenanceApiClient["distributions"]["create"]
}

type ReplaceDistributionDependencies = {
  replaceDistribution: MaintenanceApiClient["distributions"]["replace"]
}

type DeleteDistributionDependencies = {
  deleteDistribution: MaintenanceApiClient["distributions"]["delete"]
}

export async function submitCreateDistribution(
  input: CreateDistributionInput & { idempotencyKey: string },
  dependencies?: CreateDistributionDependencies
): Promise<DistributionMutationResult> {
  const { idempotencyKey, ...fields } = input
  const validation = validateDistributionInput(
    createDistributionInputSchema,
    fields
  )
  if (!validation.success) {
    return createDistributionFieldErrorResult(validation.fieldErrors)
  }
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (
      dependencies ?? { createDistribution: client!.distributions.create }
    ).createDistribution({
      headers: { "idempotency-key": idempotencyKey },
      body: validation.data,
    })
    return { status: "success", message: DISTRIBUTION_CREATED_MESSAGE }
  } catch (error) {
    return mapDistributionApiProblem(error)
  }
}

export async function submitUpdateDistribution(
  input: UpdateDistributionInput,
  dependencies?: ReplaceDistributionDependencies
): Promise<DistributionMutationResult> {
  const validation = validateDistributionInput(
    updateDistributionInputSchema,
    input
  )
  if (!validation.success) {
    return createDistributionFieldErrorResult(validation.fieldErrors)
  }
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = validation.data

  try {
    await (
      dependencies ?? { replaceDistribution: client!.distributions.replace }
    ).replaceDistribution({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: DISTRIBUTION_UPDATED_MESSAGE }
  } catch (error) {
    return mapDistributionApiProblem(error)
  }
}

export async function submitDeleteDistribution(
  input: DeleteDistributionInput,
  dependencies?: DeleteDistributionDependencies
): Promise<DistributionMutationResult> {
  const validation = validateDistributionInput(
    deleteDistributionInputSchema,
    input
  )
  if (!validation.success) {
    return createDistributionFieldErrorResult(validation.fieldErrors)
  }
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (
      dependencies ?? { deleteDistribution: client!.distributions.delete }
    ).deleteDistribution({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return { status: "success", message: DISTRIBUTION_DELETED_MESSAGE }
  } catch (error) {
    return mapDistributionApiProblem(error)
  }
}
