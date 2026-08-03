import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  ENGRAVER_DUPLICATE_CODE_ERROR,
  ENGRAVER_GENERIC_SAVE_ERROR,
  ENGRAVER_IN_USE_DELETE_ERROR,
  ENGRAVER_MISSING_ERROR,
  ENGRAVER_STALE_ERROR,
  createEngraverFieldErrorResult,
  createEngraverFormErrorResult,
} from "./engraver-mutation-errors"
import type { EngraverMutationResult } from "./engraver-mutation-errors"
import {
  ENGRAVER_AUTHORIZATION_ERROR,
  ENGRAVER_CREATED_MESSAGE,
  ENGRAVER_DELETED_MESSAGE,
  ENGRAVER_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateEngraverInput,
  DeleteEngraverInput,
  UpdateEngraverInput,
} from "./engraver-validation"

export { ENGRAVER_AUTHORIZATION_ERROR } from "./messages"
export type { EngraverMutationResult } from "./engraver-mutation-errors"

export type EngraverAuthorizationErrorResult = {
  status: "error"
  formError: typeof ENGRAVER_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createEngraver: MaintenanceApiClient["engravers"]["create"]
}

type ReplaceDependencies = {
  replaceEngraver: MaintenanceApiClient["engravers"]["replace"]
}

type DeleteDependencies = {
  deleteEngraver: MaintenanceApiClient["engravers"]["delete"]
}

export function createEngraverAuthorizationError(): EngraverAuthorizationErrorResult {
  return { status: "error", formError: ENGRAVER_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createEngraver: client.engravers.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceEngraver: client.engravers.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteEngraver: client.engravers.delete }
}

export async function submitCreateEngraver(
  input: CreateEngraverInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<EngraverMutationResult> {
  const { idempotencyKey, ...fields } = input
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createEngraver({
      headers: { "idempotency-key": idempotencyKey },
      body: fields,
    })
    return { status: "success", message: ENGRAVER_CREATED_MESSAGE }
  } catch (error) {
    return mapEngraverApiProblem(error)
  }
}

export async function submitUpdateEngraver(
  input: UpdateEngraverInput,
  dependencies?: ReplaceDependencies
): Promise<EngraverMutationResult> {
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = input

  try {
    await resolved.replaceEngraver({
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
  dependencies?: DeleteDependencies
): Promise<EngraverMutationResult> {
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteEngraver({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: ENGRAVER_DELETED_MESSAGE }
  } catch (error) {
    return mapEngraverApiProblem(error)
  }
}

function mapEngraverApiProblem(error: unknown): EngraverMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createEngraverFormErrorResult(ENGRAVER_AUTHORIZATION_ERROR)
    case "engraver_code_conflict":
      return createEngraverFieldErrorResult({
        code: ENGRAVER_DUPLICATE_CODE_ERROR,
      })
    case "engraver_validation_failed":
      return mapValidationProblem(body)
    case "engraver_in_use":
      return createEngraverFormErrorResult(ENGRAVER_IN_USE_DELETE_ERROR)
    case "engraver_not_found":
      return createEngraverFormErrorResult(ENGRAVER_MISSING_ERROR)
    case "engraver_precondition_failed":
      return createEngraverFormErrorResult(ENGRAVER_STALE_ERROR)
    default:
      return createEngraverFormErrorResult(ENGRAVER_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): EngraverMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "engraver_code_too_long"
          ? "Engraver Code must be 255 characters or fewer."
          : parameter.code === "engraver_code_invalid"
            ? "Engraver Code must use lowercase letters, numbers, and single hyphens only."
            : "Engraver Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "engraver_name_too_long"
          ? "Engraver Name must be 255 characters or fewer."
          : "Engraver Name cannot be blank."
    }
  }
  return createEngraverFieldErrorResult(fieldErrors)
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
