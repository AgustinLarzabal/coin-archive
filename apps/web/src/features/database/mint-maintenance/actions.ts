import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  MINT_DUPLICATE_CODE_ERROR,
  MINT_GENERIC_SAVE_ERROR,
  MINT_IN_USE_DELETE_ERROR,
  MINT_MISSING_ERROR,
  MINT_STALE_ERROR,
  createMintFieldErrorResult,
  createMintFormErrorResult,
} from "./mint-mutation-errors"
import type { MintMutationResult } from "./mint-mutation-errors"
import {
  MINT_AUTHORIZATION_ERROR,
  MINT_CREATED_MESSAGE,
  MINT_DELETED_MESSAGE,
  MINT_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateMintInput,
  DeleteMintInput,
  UpdateMintInput,
} from "./mint-validation"

export { MINT_AUTHORIZATION_ERROR } from "./messages"
export type { MintMutationResult } from "./mint-mutation-errors"

export type MintAuthorizationErrorResult = {
  status: "error"
  formError: typeof MINT_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createMint: MaintenanceApiClient["mints"]["create"]
}

type ReplaceDependencies = {
  replaceMint: MaintenanceApiClient["mints"]["replace"]
}

type DeleteDependencies = {
  deleteMint: MaintenanceApiClient["mints"]["delete"]
}

export function createMintAuthorizationError(): MintAuthorizationErrorResult {
  return { status: "error", formError: MINT_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createMint: client.mints.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceMint: client.mints.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteMint: client.mints.delete }
}

export async function submitCreateMint(
  input: CreateMintInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<MintMutationResult> {
  const { idempotencyKey, ...fields } = input
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createMint({
      headers: { "idempotency-key": idempotencyKey },
      body: fields,
    })
    return { status: "success", message: MINT_CREATED_MESSAGE }
  } catch (error) {
    return mapMintApiProblem(error)
  }
}

export async function submitUpdateMint(
  input: UpdateMintInput,
  dependencies?: ReplaceDependencies
): Promise<MintMutationResult> {
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = input

  try {
    await resolved.replaceMint({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: MINT_UPDATED_MESSAGE }
  } catch (error) {
    return mapMintApiProblem(error)
  }
}

export async function submitDeleteMint(
  input: DeleteMintInput,
  dependencies?: DeleteDependencies
): Promise<MintMutationResult> {
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteMint({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: MINT_DELETED_MESSAGE }
  } catch (error) {
    return mapMintApiProblem(error)
  }
}

function mapMintApiProblem(error: unknown): MintMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createMintFormErrorResult(MINT_AUTHORIZATION_ERROR)
    case "mint_code_conflict":
      return createMintFieldErrorResult({
        code: MINT_DUPLICATE_CODE_ERROR,
      })
    case "mint_validation_failed":
      return mapValidationProblem(body)
    case "mint_in_use":
      return createMintFormErrorResult(MINT_IN_USE_DELETE_ERROR)
    case "mint_not_found":
      return createMintFormErrorResult(MINT_MISSING_ERROR)
    case "mint_precondition_failed":
      return createMintFormErrorResult(MINT_STALE_ERROR)
    default:
      return createMintFormErrorResult(MINT_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): MintMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "mint_code_too_long"
          ? "Mint Code must be 255 characters or fewer."
          : parameter.code === "mint_code_invalid"
            ? "Mint Code must use lowercase letters, numbers, and single hyphens only."
            : "Mint Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "mint_name_too_long"
          ? "Mint Name must be 255 characters or fewer."
          : "Mint Name cannot be blank."
    }
  }
  return createMintFieldErrorResult(fieldErrors)
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
