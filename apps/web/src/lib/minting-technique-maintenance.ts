import { hasEditorAccess } from "@workspace/auth/client"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const MINTING_TECHNIQUE_AUTHORIZATION_ERROR =
  "Only Editors and Admins can view Minting Techniques."

export type MintingTechniqueAuthorizationErrorResult = {
  status: "error"
  formError: typeof MINTING_TECHNIQUE_AUTHORIZATION_ERROR
}

export function createMintingTechniqueAuthorizationError(): MintingTechniqueAuthorizationErrorResult {
  return {
    status: "error",
    formError: MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
  }
}

export function hasMintingTechniqueMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}
