import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  RULER_GROUP_DUPLICATE_CODE_ERROR,
  RULER_GROUP_GENERIC_SAVE_ERROR,
  RULER_GROUP_IN_USE_DELETE_ERROR,
  RULER_GROUP_MISSING_ERROR,
  RULER_GROUP_STALE_ERROR,
  createRulerGroupFieldErrorResult,
  createRulerGroupFormErrorResult,
} from "./ruler-group-mutation-errors"
import type { RulerGroupMutationResult } from "./ruler-group-mutation-errors"
import {
  RULER_GROUP_AUTHORIZATION_ERROR,
  RULER_GROUP_CREATED_MESSAGE,
  RULER_GROUP_DELETED_MESSAGE,
  RULER_GROUP_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateRulerGroupInput,
  DeleteRulerGroupInput,
  UpdateRulerGroupInput,
} from "./ruler-group-validation"

export { RULER_GROUP_AUTHORIZATION_ERROR } from "./messages"
export type { RulerGroupMutationResult } from "./ruler-group-mutation-errors"

export type RulerGroupAuthorizationErrorResult = {
  status: "error"
  formError: typeof RULER_GROUP_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createRulerGroup: MaintenanceApiClient["rulerGroups"]["create"]
}

type ReplaceDependencies = {
  replaceRulerGroup: MaintenanceApiClient["rulerGroups"]["replace"]
}

type DeleteDependencies = {
  deleteRulerGroup: MaintenanceApiClient["rulerGroups"]["delete"]
}

export function createRulerGroupAuthorizationError(): RulerGroupAuthorizationErrorResult {
  return { status: "error", formError: RULER_GROUP_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createRulerGroup: client.rulerGroups.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceRulerGroup: client.rulerGroups.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteRulerGroup: client.rulerGroups.delete }
}

export async function submitCreateRulerGroup(
  input: CreateRulerGroupInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<RulerGroupMutationResult> {
  const { idempotencyKey, ...fields } = input
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createRulerGroup({
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
  dependencies?: ReplaceDependencies
): Promise<RulerGroupMutationResult> {
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = input

  try {
    await resolved.replaceRulerGroup({
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
  dependencies?: DeleteDependencies
): Promise<RulerGroupMutationResult> {
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteRulerGroup({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: RULER_GROUP_DELETED_MESSAGE }
  } catch (error) {
    return mapRulerGroupApiProblem(error)
  }
}

function mapRulerGroupApiProblem(error: unknown): RulerGroupMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createRulerGroupFormErrorResult(RULER_GROUP_AUTHORIZATION_ERROR)
    case "ruler_group_code_conflict":
      return createRulerGroupFieldErrorResult({
        code: RULER_GROUP_DUPLICATE_CODE_ERROR,
      })
    case "ruler_group_validation_failed":
      return mapValidationProblem(body)
    case "ruler_group_in_use":
      return createRulerGroupFormErrorResult(RULER_GROUP_IN_USE_DELETE_ERROR)
    case "ruler_group_not_found":
      return createRulerGroupFormErrorResult(RULER_GROUP_MISSING_ERROR)
    case "ruler_group_precondition_failed":
      return createRulerGroupFormErrorResult(RULER_GROUP_STALE_ERROR)
    default:
      return createRulerGroupFormErrorResult(RULER_GROUP_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): RulerGroupMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "ruler_group_code_too_long"
          ? "Ruler Group Code must be 255 characters or fewer."
          : parameter.code === "ruler_group_code_invalid"
            ? "Ruler Group Code must use lowercase letters, numbers, and hyphens only."
            : "Ruler Group Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "ruler_group_name_too_long"
          ? "Ruler Group Name must be 255 characters or fewer."
          : "Ruler Group Name cannot be blank."
    }
  }
  return createRulerGroupFieldErrorResult(fieldErrors)
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
