import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  COMPOSITION_DUPLICATE_CODE_ERROR,
  COMPOSITION_GENERIC_SAVE_ERROR,
  COMPOSITION_IN_USE_DELETE_ERROR,
  COMPOSITION_MISSING_ERROR,
  COMPOSITION_STALE_ERROR,
  createCompositionFieldErrorResult,
  createCompositionFormErrorResult,
} from "./composition-mutation-errors"
import type { CompositionMutationResult } from "./composition-mutation-errors"
import {
  COMPOSITION_AUTHORIZATION_ERROR,
  COMPOSITION_CREATED_MESSAGE,
  COMPOSITION_DELETED_MESSAGE,
  COMPOSITION_UPDATED_MESSAGE,
} from "./messages"
import {
  createCompositionInputSchema,
  deleteCompositionInputSchema,
  updateCompositionInputSchema,
  validateCompositionInput,
} from "./validation"
import type {
  CreateCompositionInput,
  DeleteCompositionInput,
  UpdateCompositionInput,
} from "./validation"

export { COMPOSITION_AUTHORIZATION_ERROR } from "./messages"
export type { CompositionMutationResult } from "./composition-mutation-errors"

export type CompositionAuthorizationErrorResult = {
  status: "error"
  formError: typeof COMPOSITION_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createComposition: MaintenanceApiClient["compositions"]["create"]
}

type ReplaceDependencies = {
  replaceComposition: MaintenanceApiClient["compositions"]["replace"]
}

type DeleteDependencies = {
  deleteComposition: MaintenanceApiClient["compositions"]["delete"]
}

export function createCompositionAuthorizationError(): CompositionAuthorizationErrorResult {
  return { status: "error", formError: COMPOSITION_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createComposition: client.compositions.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceComposition: client.compositions.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteComposition: client.compositions.delete }
}

export async function submitCreateComposition(
  input: CreateCompositionInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<CompositionMutationResult> {
  const { idempotencyKey, ...fields } = input
  const validation = validateCompositionInput(
    createCompositionInputSchema,
    fields
  )
  if (!validation.success) {
    return createCompositionFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createComposition({
      headers: { "idempotency-key": idempotencyKey },
      body: validation.data,
    })
    return { status: "success", message: COMPOSITION_CREATED_MESSAGE }
  } catch (error) {
    return mapCompositionApiProblem(error)
  }
}

export async function submitUpdateComposition(
  input: UpdateCompositionInput,
  dependencies?: ReplaceDependencies
): Promise<CompositionMutationResult> {
  const validation = validateCompositionInput(
    updateCompositionInputSchema,
    input
  )
  if (!validation.success) {
    return createCompositionFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = validation.data

  try {
    await resolved.replaceComposition({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: COMPOSITION_UPDATED_MESSAGE }
  } catch (error) {
    return mapCompositionApiProblem(error)
  }
}

export async function submitDeleteComposition(
  input: DeleteCompositionInput,
  dependencies?: DeleteDependencies
): Promise<CompositionMutationResult> {
  const validation = validateCompositionInput(
    deleteCompositionInputSchema,
    input
  )
  if (!validation.success) {
    return createCompositionFieldErrorResult(validation.fieldErrors)
  }
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteComposition({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return { status: "success", message: COMPOSITION_DELETED_MESSAGE }
  } catch (error) {
    return mapCompositionApiProblem(error)
  }
}

function mapCompositionApiProblem(error: unknown): CompositionMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createCompositionFormErrorResult(COMPOSITION_AUTHORIZATION_ERROR)
    case "composition_code_conflict":
      return createCompositionFieldErrorResult({
        code: COMPOSITION_DUPLICATE_CODE_ERROR,
      })
    case "composition_validation_failed":
      return mapValidationProblem(body)
    case "composition_in_use":
      return createCompositionFormErrorResult(COMPOSITION_IN_USE_DELETE_ERROR)
    case "composition_not_found":
      return createCompositionFormErrorResult(COMPOSITION_MISSING_ERROR)
    case "composition_precondition_failed":
      return createCompositionFormErrorResult(COMPOSITION_STALE_ERROR)
    default:
      return createCompositionFormErrorResult(COMPOSITION_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): CompositionMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "composition_code_too_long"
          ? "Composition Code must be 255 characters or fewer."
          : parameter.code === "composition_code_invalid"
            ? "Composition Code must use lowercase letters, numbers, and single hyphens only."
            : "Composition Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "composition_name_too_long"
          ? "Composition Name must be 255 characters or fewer."
          : "Composition Name cannot be blank."
    }
  }
  return createCompositionFieldErrorResult(fieldErrors)
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
