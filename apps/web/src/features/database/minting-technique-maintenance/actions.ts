import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  MINTING_TECHNIQUE_DUPLICATE_CODE_ERROR,
  MINTING_TECHNIQUE_GENERIC_SAVE_ERROR,
  MINTING_TECHNIQUE_IN_USE_DELETE_ERROR,
  MINTING_TECHNIQUE_MISSING_ERROR,
  MINTING_TECHNIQUE_STALE_ERROR,
  createMintingTechniqueFieldErrorResult,
  createMintingTechniqueFormErrorResult,
} from "./minting-technique-mutation-errors"
import type { MintingTechniqueMutationResult } from "./minting-technique-mutation-errors"
import {
  MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
  MINTING_TECHNIQUE_CREATED_MESSAGE,
  MINTING_TECHNIQUE_DELETED_MESSAGE,
  MINTING_TECHNIQUE_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateMintingTechniqueInput,
  DeleteMintingTechniqueInput,
  UpdateMintingTechniqueInput,
} from "./minting-technique-validation"

export { MINTING_TECHNIQUE_AUTHORIZATION_ERROR } from "./messages"
export type { MintingTechniqueMutationResult } from "./minting-technique-mutation-errors"

export type MintingTechniqueAuthorizationErrorResult = {
  status: "error"
  formError: typeof MINTING_TECHNIQUE_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createMintingTechnique: MaintenanceApiClient["mintingTechniques"]["create"]
}

type ReplaceDependencies = {
  replaceMintingTechnique: MaintenanceApiClient["mintingTechniques"]["replace"]
}

type DeleteDependencies = {
  deleteMintingTechnique: MaintenanceApiClient["mintingTechniques"]["delete"]
}

export function createMintingTechniqueAuthorizationError(): MintingTechniqueAuthorizationErrorResult {
  return { status: "error", formError: MINTING_TECHNIQUE_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createMintingTechnique: client.mintingTechniques.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceMintingTechnique: client.mintingTechniques.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteMintingTechnique: client.mintingTechniques.delete }
}

export async function submitCreateMintingTechnique(
  input: CreateMintingTechniqueInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<MintingTechniqueMutationResult> {
  const { idempotencyKey, ...fields } = input
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createMintingTechnique({
      headers: { "idempotency-key": idempotencyKey },
      body: fields,
    })
    return { status: "success", message: MINTING_TECHNIQUE_CREATED_MESSAGE }
  } catch (error) {
    return mapMintingTechniqueApiProblem(error)
  }
}

export async function submitUpdateMintingTechnique(
  input: UpdateMintingTechniqueInput,
  dependencies?: ReplaceDependencies
): Promise<MintingTechniqueMutationResult> {
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = input

  try {
    await resolved.replaceMintingTechnique({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: MINTING_TECHNIQUE_UPDATED_MESSAGE }
  } catch (error) {
    return mapMintingTechniqueApiProblem(error)
  }
}

export async function submitDeleteMintingTechnique(
  input: DeleteMintingTechniqueInput,
  dependencies?: DeleteDependencies
): Promise<MintingTechniqueMutationResult> {
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteMintingTechnique({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: MINTING_TECHNIQUE_DELETED_MESSAGE }
  } catch (error) {
    return mapMintingTechniqueApiProblem(error)
  }
}

function mapMintingTechniqueApiProblem(
  error: unknown
): MintingTechniqueMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createMintingTechniqueFormErrorResult(
        MINTING_TECHNIQUE_AUTHORIZATION_ERROR
      )
    case "minting_technique_code_conflict":
      return createMintingTechniqueFieldErrorResult({
        code: MINTING_TECHNIQUE_DUPLICATE_CODE_ERROR,
      })
    case "minting_technique_validation_failed":
      return mapValidationProblem(body)
    case "minting_technique_in_use":
      return createMintingTechniqueFormErrorResult(
        MINTING_TECHNIQUE_IN_USE_DELETE_ERROR
      )
    case "minting_technique_not_found":
      return createMintingTechniqueFormErrorResult(
        MINTING_TECHNIQUE_MISSING_ERROR
      )
    case "minting_technique_precondition_failed":
      return createMintingTechniqueFormErrorResult(
        MINTING_TECHNIQUE_STALE_ERROR
      )
    default:
      return createMintingTechniqueFormErrorResult(
        MINTING_TECHNIQUE_GENERIC_SAVE_ERROR
      )
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): MintingTechniqueMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "minting_technique_code_too_long"
          ? "Minting Technique Code must be 255 characters or fewer."
          : parameter.code === "minting_technique_code_invalid"
            ? "Minting Technique Code must use lowercase letters, numbers, and single hyphens only."
            : "Minting Technique Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "minting_technique_name_too_long"
          ? "Minting Technique Name must be 255 characters or fewer."
          : "Minting Technique Name cannot be blank."
    }
  }
  return createMintingTechniqueFieldErrorResult(fieldErrors)
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
