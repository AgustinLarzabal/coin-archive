import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  EDGE_DUPLICATE_CODE_ERROR,
  EDGE_GENERIC_SAVE_ERROR,
  EDGE_IN_USE_DELETE_ERROR,
  EDGE_MISSING_ERROR,
  EDGE_STALE_ERROR,
  createEdgeFieldErrorResult,
  createEdgeFormErrorResult,
} from "./edge-mutation-errors"
import type { EdgeMutationResult } from "./edge-mutation-errors"
import {
  EDGE_AUTHORIZATION_ERROR,
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

export { EDGE_AUTHORIZATION_ERROR } from "./messages"
export type { EdgeMutationResult } from "./edge-mutation-errors"

export type EdgeAuthorizationErrorResult = {
  status: "error"
  formError: typeof EDGE_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createEdge: MaintenanceApiClient["edges"]["create"]
}

type ReplaceDependencies = {
  replaceEdge: MaintenanceApiClient["edges"]["replace"]
}

type DeleteDependencies = {
  deleteEdge: MaintenanceApiClient["edges"]["delete"]
}

export function createEdgeAuthorizationError(): EdgeAuthorizationErrorResult {
  return { status: "error", formError: EDGE_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createEdge: client.edges.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceEdge: client.edges.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteEdge: client.edges.delete }
}

export async function submitCreateEdge(
  input: CreateEdgeInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<EdgeMutationResult> {
  const { idempotencyKey, ...fields } = input
  const validation = validateEdgeInput(createEdgeInputSchema, fields)
  if (!validation.success) {
    return createEdgeFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createEdge({
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
  dependencies?: ReplaceDependencies
): Promise<EdgeMutationResult> {
  const validation = validateEdgeInput(updateEdgeInputSchema, input)
  if (!validation.success) {
    return createEdgeFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = validation.data

  try {
    await resolved.replaceEdge({
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
  dependencies?: DeleteDependencies
): Promise<EdgeMutationResult> {
  const validation = validateEdgeInput(deleteEdgeInputSchema, input)
  if (!validation.success) {
    return createEdgeFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteEdge({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return { status: "success", message: EDGE_DELETED_MESSAGE }
  } catch (error) {
    return mapEdgeApiProblem(error)
  }
}

function mapEdgeApiProblem(error: unknown): EdgeMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createEdgeFormErrorResult(EDGE_AUTHORIZATION_ERROR)
    case "edge_code_conflict":
      return createEdgeFieldErrorResult({
        code: EDGE_DUPLICATE_CODE_ERROR,
      })
    case "edge_validation_failed":
      return mapValidationProblem(body)
    case "edge_in_use":
      return createEdgeFormErrorResult(EDGE_IN_USE_DELETE_ERROR)
    case "edge_not_found":
      return createEdgeFormErrorResult(EDGE_MISSING_ERROR)
    case "edge_precondition_failed":
      return createEdgeFormErrorResult(EDGE_STALE_ERROR)
    default:
      return createEdgeFormErrorResult(EDGE_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): EdgeMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "edge_code_too_long"
          ? "Edge Code must be 255 characters or fewer."
          : parameter.code === "edge_code_invalid"
            ? "Edge Code must use lowercase letters, numbers, and single hyphens only."
            : "Edge Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "edge_name_too_long"
          ? "Edge Name must be 255 characters or fewer."
          : "Edge Name cannot be blank."
    }
  }
  return createEdgeFieldErrorResult(fieldErrors)
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
