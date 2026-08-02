import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  ORIENTATION_DUPLICATE_CODE_ERROR,
  ORIENTATION_GENERIC_SAVE_ERROR,
  ORIENTATION_IN_USE_DELETE_ERROR,
  ORIENTATION_INVALID_CODE_ERROR,
  ORIENTATION_MISSING_ERROR,
  ORIENTATION_STALE_ERROR,
  createOrientationFieldErrorResult,
  createOrientationFormErrorResult,
} from "./orientation-mutation-errors"
import type { OrientationMutationResult } from "./orientation-mutation-errors"
import {
  createOrientationInputSchema,
  deleteOrientationInputSchema,
  updateOrientationInputSchema,
  validateOrientationInput,
} from "./orientation-validation"
import type {
  CreateOrientationInput,
  DeleteOrientationInput,
  UpdateOrientationInput,
} from "./orientation-validation"

export const ORIENTATION_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Orientations."

export type OrientationAuthorizationErrorResult = {
  status: "error"
  formError: typeof ORIENTATION_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createOrientation: MaintenanceApiClient["orientations"]["create"]
  createIdempotencyKey: () => string
}

type ReplaceDependencies = {
  replaceOrientation: MaintenanceApiClient["orientations"]["replace"]
}

type DeleteDependencies = {
  deleteOrientation: MaintenanceApiClient["orientations"]["delete"]
}

export function createOrientationAuthorizationError(): OrientationAuthorizationErrorResult {
  return { status: "error", formError: ORIENTATION_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createOrientation: client.orientations.create,
    createIdempotencyKey: () => crypto.randomUUID(),
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceOrientation: client.orientations.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteOrientation: client.orientations.delete }
}

export async function submitCreateOrientation(
  input: CreateOrientationInput,
  dependencies?: CreateDependencies
): Promise<OrientationMutationResult> {
  const validation = validateOrientationInput(
    createOrientationInputSchema,
    input
  )
  if (!validation.success) {
    return createOrientationFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createOrientation({
      headers: { "idempotency-key": resolved.createIdempotencyKey() },
      body: validation.data,
    })
    return { status: "success", message: "Orientation added." }
  } catch (error) {
    return mapOrientationApiProblem(error)
  }
}

export async function submitUpdateOrientation(
  input: UpdateOrientationInput,
  dependencies?: ReplaceDependencies
): Promise<OrientationMutationResult> {
  const validation = validateOrientationInput(
    updateOrientationInputSchema,
    input
  )
  if (!validation.success) {
    return createOrientationFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = validation.data

  try {
    await resolved.replaceOrientation({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: "Saved." }
  } catch (error) {
    return mapOrientationApiProblem(error)
  }
}

export async function submitDeleteOrientation(
  input: DeleteOrientationInput,
  dependencies?: DeleteDependencies
): Promise<OrientationMutationResult> {
  const validation = validateOrientationInput(
    deleteOrientationInputSchema,
    input
  )
  if (!validation.success) {
    return createOrientationFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteOrientation({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return { status: "success", message: "Orientation deleted." }
  } catch (error) {
    return mapOrientationApiProblem(error)
  }
}

function mapOrientationApiProblem(error: unknown): OrientationMutationResult {
  const code = getMaintenanceProblemCode(error)
  switch (code) {
    case "authentication_required":
    case "editor_access_required":
      return createOrientationFormErrorResult(ORIENTATION_AUTHORIZATION_ERROR)
    case "orientation_code_conflict":
      return createOrientationFieldErrorResult({
        code: ORIENTATION_DUPLICATE_CODE_ERROR,
      })
    case "orientation_validation_failed":
      return mapValidationProblem(error)
    case "orientation_in_use":
      return createOrientationFormErrorResult(ORIENTATION_IN_USE_DELETE_ERROR)
    case "orientation_not_found":
      return createOrientationFormErrorResult(ORIENTATION_MISSING_ERROR)
    case "orientation_precondition_failed":
      return createOrientationFormErrorResult(ORIENTATION_STALE_ERROR)
    default:
      return createOrientationFormErrorResult(ORIENTATION_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(error: unknown): OrientationMutationResult {
  const body = getProblemBody(error)
  const invalidParams =
    body !== undefined &&
    "invalidParams" in body &&
    Array.isArray(body.invalidParams)
      ? body.invalidParams
      : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if ("name" in parameter && parameter.name === "/code") {
      fieldErrors.code = ORIENTATION_INVALID_CODE_ERROR
    }
    if ("name" in parameter && parameter.name === "/name") {
      fieldErrors.name = "Orientation Name cannot be blank."
    }
  }
  return createOrientationFieldErrorResult(fieldErrors)
}

function getMaintenanceProblemCode(error: unknown) {
  const body = getProblemBody(error)
  return body !== undefined && "code" in body && typeof body.code === "string"
    ? body.code
    : undefined
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
