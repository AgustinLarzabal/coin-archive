import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  DISTRIBUTION_DUPLICATE_CODE_ERROR,
  DISTRIBUTION_GENERIC_SAVE_ERROR,
  DISTRIBUTION_IN_USE_DELETE_ERROR,
  DISTRIBUTION_MISSING_ERROR,
  DISTRIBUTION_STALE_ERROR,
  createDistributionFieldErrorResult,
  createDistributionFormErrorResult,
} from "./distribution-mutation-errors"
import type { DistributionMutationResult } from "./distribution-mutation-errors"
import {
  DISTRIBUTION_AUTHORIZATION_ERROR,
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

export { DISTRIBUTION_AUTHORIZATION_ERROR } from "./messages"
export type { DistributionMutationResult } from "./distribution-mutation-errors"

export type DistributionAuthorizationErrorResult = {
  status: "error"
  formError: typeof DISTRIBUTION_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createDistribution: MaintenanceApiClient["distributions"]["create"]
}

type ReplaceDependencies = {
  replaceDistribution: MaintenanceApiClient["distributions"]["replace"]
}

type DeleteDependencies = {
  deleteDistribution: MaintenanceApiClient["distributions"]["delete"]
}

export function createDistributionAuthorizationError(): DistributionAuthorizationErrorResult {
  return { status: "error", formError: DISTRIBUTION_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createDistribution: client.distributions.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceDistribution: client.distributions.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteDistribution: client.distributions.delete }
}

export async function submitCreateDistribution(
  input: CreateDistributionInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<DistributionMutationResult> {
  const { idempotencyKey, ...fields } = input
  const validation = validateDistributionInput(
    createDistributionInputSchema,
    fields
  )
  if (!validation.success) {
    return createDistributionFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createDistribution({
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
  dependencies?: ReplaceDependencies
): Promise<DistributionMutationResult> {
  const validation = validateDistributionInput(
    updateDistributionInputSchema,
    input
  )
  if (!validation.success) {
    return createDistributionFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = validation.data

  try {
    await resolved.replaceDistribution({
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
  dependencies?: DeleteDependencies
): Promise<DistributionMutationResult> {
  const validation = validateDistributionInput(
    deleteDistributionInputSchema,
    input
  )
  if (!validation.success) {
    return createDistributionFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteDistribution({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return { status: "success", message: DISTRIBUTION_DELETED_MESSAGE }
  } catch (error) {
    return mapDistributionApiProblem(error)
  }
}

function mapDistributionApiProblem(error: unknown): DistributionMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createDistributionFormErrorResult(DISTRIBUTION_AUTHORIZATION_ERROR)
    case "distribution_code_conflict":
      return createDistributionFieldErrorResult({
        code: DISTRIBUTION_DUPLICATE_CODE_ERROR,
      })
    case "distribution_validation_failed":
      return mapValidationProblem(body)
    case "distribution_in_use":
      return createDistributionFormErrorResult(DISTRIBUTION_IN_USE_DELETE_ERROR)
    case "distribution_not_found":
      return createDistributionFormErrorResult(DISTRIBUTION_MISSING_ERROR)
    case "distribution_precondition_failed":
      return createDistributionFormErrorResult(DISTRIBUTION_STALE_ERROR)
    default:
      return createDistributionFormErrorResult(DISTRIBUTION_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): DistributionMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "distribution_code_too_long"
          ? "Distribution Code must be 255 characters or fewer."
          : parameter.code === "distribution_code_invalid"
            ? "Distribution Code must use lowercase letters, numbers, and single hyphens only."
            : "Distribution Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "distribution_name_too_long"
          ? "Distribution Name must be 255 characters or fewer."
          : "Distribution Name cannot be blank."
    }
  }
  return createDistributionFieldErrorResult(fieldErrors)
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
