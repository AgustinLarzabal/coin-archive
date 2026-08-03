import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  RULER_DUPLICATE_CODE_ERROR,
  RULER_GENERIC_SAVE_ERROR,
  RULER_IN_USE_DELETE_ERROR,
  RULER_MISSING_ERROR,
  RULER_MISSING_RULER_GROUP_ERROR,
  RULER_STALE_ERROR,
  createRulerFieldErrorResult,
  createRulerFormErrorResult,
} from "./ruler-mutation-errors"
import type { RulerMutationResult } from "./ruler-mutation-errors"
import {
  RULER_AUTHORIZATION_ERROR,
  RULER_CREATED_MESSAGE,
  RULER_DELETED_MESSAGE,
  RULER_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateRulerInput,
  DeleteRulerInput,
  UpdateRulerInput,
} from "./ruler-validation"

export { RULER_AUTHORIZATION_ERROR } from "./messages"
export type { RulerMutationResult } from "./ruler-mutation-errors"

export type RulerAuthorizationErrorResult = {
  status: "error"
  formError: typeof RULER_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createRuler: MaintenanceApiClient["rulers"]["create"]
}

type ReplaceDependencies = {
  replaceRuler: MaintenanceApiClient["rulers"]["replace"]
}

type DeleteDependencies = {
  deleteRuler: MaintenanceApiClient["rulers"]["delete"]
}

export function createRulerAuthorizationError(): RulerAuthorizationErrorResult {
  return { status: "error", formError: RULER_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createRuler: client.rulers.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceRuler: client.rulers.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteRuler: client.rulers.delete }
}

export async function submitCreateRuler(
  input: CreateRulerInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<RulerMutationResult> {
  const { idempotencyKey, ...fields } = input
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createRuler({
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
  dependencies?: ReplaceDependencies
): Promise<RulerMutationResult> {
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = input

  try {
    await resolved.replaceRuler({
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
  dependencies?: DeleteDependencies
): Promise<RulerMutationResult> {
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteRuler({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: RULER_DELETED_MESSAGE }
  } catch (error) {
    return mapRulerApiProblem(error)
  }
}

function mapRulerApiProblem(error: unknown): RulerMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createRulerFormErrorResult(RULER_AUTHORIZATION_ERROR)
    case "ruler_code_conflict":
      return createRulerFieldErrorResult({
        code: RULER_DUPLICATE_CODE_ERROR,
      })
    case "ruler_validation_failed":
      return mapValidationProblem(body)
    case "ruler_group_not_found":
      return createRulerFieldErrorResult({
        rulerGroupId: RULER_MISSING_RULER_GROUP_ERROR,
      })
    case "ruler_in_use":
      return createRulerFormErrorResult(RULER_IN_USE_DELETE_ERROR)
    case "ruler_not_found":
      return createRulerFormErrorResult(RULER_MISSING_ERROR)
    case "ruler_precondition_failed":
      return createRulerFormErrorResult(RULER_STALE_ERROR)
    default:
      return createRulerFormErrorResult(RULER_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): RulerMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: {
    code?: string
    name?: string
    rulerGroupId?: string
  } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "ruler_code_too_long"
          ? "Ruler Code must be 255 characters or fewer."
          : parameter.code === "ruler_code_invalid"
            ? "Ruler Code must use lowercase letters, numbers, and hyphens only."
            : "Ruler Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "ruler_name_too_long"
          ? "Ruler Name must be 255 characters or fewer."
          : "Ruler Name cannot be blank."
    }
    if (parameter.name === "/rulerGroupId") {
      fieldErrors.rulerGroupId = RULER_MISSING_RULER_GROUP_ERROR
    }
  }
  return createRulerFieldErrorResult(fieldErrors)
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
