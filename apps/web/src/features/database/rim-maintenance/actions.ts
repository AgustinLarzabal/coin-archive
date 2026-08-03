import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  RIM_DUPLICATE_CODE_ERROR,
  RIM_GENERIC_SAVE_ERROR,
  RIM_IN_USE_DELETE_ERROR,
  RIM_MISSING_ERROR,
  RIM_STALE_ERROR,
  createRimFieldErrorResult,
  createRimFormErrorResult,
} from "./rim-mutation-errors"
import type { RimMutationResult } from "./rim-mutation-errors"
import {
  RIM_AUTHORIZATION_ERROR,
  RIM_CREATED_MESSAGE,
  RIM_DELETED_MESSAGE,
  RIM_UPDATED_MESSAGE,
} from "./messages"
import {
  createRimInputSchema,
  deleteRimInputSchema,
  updateRimInputSchema,
  validateRimInput,
} from "./rim-validation"
import type {
  CreateRimInput,
  DeleteRimInput,
  UpdateRimInput,
} from "./rim-validation"

export { RIM_AUTHORIZATION_ERROR } from "./messages"
export type { RimMutationResult } from "./rim-mutation-errors"

export type RimAuthorizationErrorResult = {
  status: "error"
  formError: typeof RIM_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createRim: MaintenanceApiClient["rims"]["create"]
}

type ReplaceDependencies = {
  replaceRim: MaintenanceApiClient["rims"]["replace"]
}

type DeleteDependencies = {
  deleteRim: MaintenanceApiClient["rims"]["delete"]
}

export function createRimAuthorizationError(): RimAuthorizationErrorResult {
  return { status: "error", formError: RIM_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createRim: client.rims.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceRim: client.rims.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteRim: client.rims.delete }
}

export async function submitCreateRim(
  input: CreateRimInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<RimMutationResult> {
  const { idempotencyKey, ...fields } = input
  const validation = validateRimInput(createRimInputSchema, fields)
  if (!validation.success) {
    return createRimFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createRim({
      headers: { "idempotency-key": idempotencyKey },
      body: validation.data,
    })
    return { status: "success", message: RIM_CREATED_MESSAGE }
  } catch (error) {
    return mapRimApiProblem(error)
  }
}

export async function submitUpdateRim(
  input: UpdateRimInput,
  dependencies?: ReplaceDependencies
): Promise<RimMutationResult> {
  const validation = validateRimInput(updateRimInputSchema, input)
  if (!validation.success) {
    return createRimFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = validation.data

  try {
    await resolved.replaceRim({
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
  dependencies?: DeleteDependencies
): Promise<RimMutationResult> {
  const validation = validateRimInput(deleteRimInputSchema, input)
  if (!validation.success) {
    return createRimFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteRim({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return { status: "success", message: RIM_DELETED_MESSAGE }
  } catch (error) {
    return mapRimApiProblem(error)
  }
}

function mapRimApiProblem(error: unknown): RimMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createRimFormErrorResult(RIM_AUTHORIZATION_ERROR)
    case "rim_code_conflict":
      return createRimFieldErrorResult({
        code: RIM_DUPLICATE_CODE_ERROR,
      })
    case "rim_validation_failed":
      return mapValidationProblem(body)
    case "rim_in_use":
      return createRimFormErrorResult(RIM_IN_USE_DELETE_ERROR)
    case "rim_not_found":
      return createRimFormErrorResult(RIM_MISSING_ERROR)
    case "rim_precondition_failed":
      return createRimFormErrorResult(RIM_STALE_ERROR)
    default:
      return createRimFormErrorResult(RIM_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): RimMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "rim_code_too_long"
          ? "Rim Code must be 255 characters or fewer."
          : parameter.code === "rim_code_invalid"
            ? "Rim Code must use lowercase letters, numbers, and single hyphens only."
            : "Rim Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "rim_name_too_long"
          ? "Rim Name must be 255 characters or fewer."
          : "Rim Name cannot be blank."
    }
  }
  return createRimFieldErrorResult(fieldErrors)
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
