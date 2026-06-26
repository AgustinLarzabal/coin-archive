import { hasEditorAccess } from "@workspace/auth/client"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const ENGRAVER_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Engravers."

export type EngraverAuthorizationErrorResult = {
  status: "error"
  formError: typeof ENGRAVER_AUTHORIZATION_ERROR
}

export function createEngraverAuthorizationError(): EngraverAuthorizationErrorResult {
  return {
    status: "error",
    formError: ENGRAVER_AUTHORIZATION_ERROR,
  }
}

export function hasEngraverMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}
