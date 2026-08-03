import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  ISSUER_DUPLICATE_CODE_ERROR,
  ISSUER_GENERIC_SAVE_ERROR,
  ISSUER_COINS_DELETE_ERROR,
  ISSUER_CHILDREN_DELETE_ERROR,
  ISSUER_MISSING_ERROR,
  ISSUER_STALE_ERROR,
  createIssuerFieldErrorResult,
  createIssuerFormErrorResult,
} from "./issuer-mutation-errors"
import type { IssuerMutationResult } from "./issuer-mutation-errors"
import {
  ISSUER_AUTHORIZATION_ERROR,
  ISSUER_CREATED_MESSAGE,
  ISSUER_DELETED_MESSAGE,
  ISSUER_UPDATED_MESSAGE,
  ISSUER_CYCLIC_PARENT_ERROR,
  ISSUER_INVALID_ISO_CODE_ERROR,
  ISSUER_MISSING_PARENT_ERROR,
  ISSUER_SELF_PARENT_ERROR,
} from "./messages"
import type {
  CreateIssuerInput,
  DeleteIssuerInput,
  UpdateIssuerInput,
} from "./validation"
import { getIssuerProblemBody } from "./issuer-api-problem"

export { ISSUER_AUTHORIZATION_ERROR } from "./messages"
export type { IssuerMutationResult } from "./issuer-mutation-errors"

export type IssuerAuthorizationErrorResult = {
  status: "error"
  formError: typeof ISSUER_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createIssuer: MaintenanceApiClient["issuers"]["create"]
}

type ReplaceDependencies = {
  replaceIssuer: MaintenanceApiClient["issuers"]["replace"]
}

type DeleteDependencies = {
  deleteIssuer: MaintenanceApiClient["issuers"]["delete"]
}

export function createIssuerAuthorizationError(): IssuerAuthorizationErrorResult {
  return { status: "error", formError: ISSUER_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createIssuer: client.issuers.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceIssuer: client.issuers.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteIssuer: client.issuers.delete }
}

export async function submitCreateIssuer(
  input: CreateIssuerInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<IssuerMutationResult> {
  const { idempotencyKey, ...fields } = input
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createIssuer({
      headers: { "idempotency-key": idempotencyKey },
      body: fields,
    })
    return { status: "success", message: ISSUER_CREATED_MESSAGE }
  } catch (error) {
    return mapIssuerApiProblem(error)
  }
}

export async function submitUpdateIssuer(
  input: UpdateIssuerInput,
  dependencies?: ReplaceDependencies
): Promise<IssuerMutationResult> {
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = input

  try {
    await resolved.replaceIssuer({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: ISSUER_UPDATED_MESSAGE }
  } catch (error) {
    return mapIssuerApiProblem(error)
  }
}

export async function submitDeleteIssuer(
  input: DeleteIssuerInput,
  dependencies?: DeleteDependencies
): Promise<IssuerMutationResult> {
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteIssuer({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: ISSUER_DELETED_MESSAGE }
  } catch (error) {
    return mapIssuerApiProblem(error)
  }
}

function mapIssuerApiProblem(error: unknown): IssuerMutationResult {
  const body = getIssuerProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createIssuerFormErrorResult(ISSUER_AUTHORIZATION_ERROR)
    case "issuer_code_conflict":
      return createIssuerFieldErrorResult({
        code: ISSUER_DUPLICATE_CODE_ERROR,
      })
    case "issuer_validation_failed":
      return mapValidationProblem(body)
    case "issuer_parent_not_found":
      return createIssuerFieldErrorResult({
        parentIssuerId: ISSUER_MISSING_PARENT_ERROR,
      })
    case "issuer_self_parent":
      return createIssuerFieldErrorResult({
        parentIssuerId: ISSUER_SELF_PARENT_ERROR,
      })
    case "issuer_parent_cycle":
      return createIssuerFieldErrorResult({
        parentIssuerId: ISSUER_CYCLIC_PARENT_ERROR,
      })
    case "issuer_in_use":
      return createIssuerFormErrorResult(ISSUER_COINS_DELETE_ERROR)
    case "issuer_has_children":
      return createIssuerFormErrorResult(ISSUER_CHILDREN_DELETE_ERROR)
    case "issuer_not_found":
      return createIssuerFormErrorResult(ISSUER_MISSING_ERROR)
    case "issuer_precondition_failed":
      return createIssuerFormErrorResult(ISSUER_STALE_ERROR)
    default:
      return createIssuerFormErrorResult(ISSUER_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): IssuerMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: {
    code?: string
    isoCode?: string
    name?: string
    parentIssuerId?: string
  } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "issuer_code_too_long"
          ? "Issuer Code must be 255 characters or fewer."
          : parameter.code === "issuer_code_invalid"
            ? "Issuer Code must use lowercase letters, numbers, and single hyphens only."
            : "Issuer Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "issuer_name_too_long"
          ? "Issuer Name must be 255 characters or fewer."
          : "Issuer Name cannot be blank."
    }
    if (parameter.name === "/isoCode") {
      fieldErrors.isoCode = ISSUER_INVALID_ISO_CODE_ERROR
    }
    if (parameter.name === "/parentIssuerId") {
      fieldErrors.parentIssuerId =
        parameter.code === "issuer_parent_not_found"
          ? ISSUER_MISSING_PARENT_ERROR
          : parameter.code === "issuer_self_parent"
            ? ISSUER_SELF_PARENT_ERROR
            : parameter.code === "issuer_parent_cycle"
              ? ISSUER_CYCLIC_PARENT_ERROR
              : "Parent Issuer must be a valid record."
    }
  }
  return createIssuerFieldErrorResult(fieldErrors)
}
