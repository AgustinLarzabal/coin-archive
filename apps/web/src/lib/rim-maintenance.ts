import { hasEditorAccess } from "@workspace/auth/client"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const RIM_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Rims."

export type RimAuthorizationErrorResult = {
  status: "error"
  formError: typeof RIM_AUTHORIZATION_ERROR
}

export function createRimAuthorizationError(): RimAuthorizationErrorResult {
  return {
    status: "error",
    formError: RIM_AUTHORIZATION_ERROR,
  }
}

export function hasRimMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}
