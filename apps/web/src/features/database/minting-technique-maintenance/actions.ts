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
import { MINTING_TECHNIQUE_AUTHORIZATION_ERROR } from "./messages"

export { MINTING_TECHNIQUE_AUTHORIZATION_ERROR } from "./messages"
export type { MintingTechniqueMutationResult } from "./minting-technique-mutation-errors"

export type MintingTechniqueAuthorizationErrorResult = {
  status: "error"
  formError: typeof MINTING_TECHNIQUE_AUTHORIZATION_ERROR
}

export function createMintingTechniqueAuthorizationError(): MintingTechniqueAuthorizationErrorResult {
  return { status: "error", formError: MINTING_TECHNIQUE_AUTHORIZATION_ERROR }
}

export function mapMintingTechniqueApiProblem(
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
