import { hasEditorAccess } from "@workspace/auth/client"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const THEME_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Themes."

export type ThemeAuthorizationErrorResult = {
  status: "error"
  formError: typeof THEME_AUTHORIZATION_ERROR
}

export function hasThemeMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

export function createThemeAuthorizationError(): ThemeAuthorizationErrorResult {
  return {
    status: "error",
    formError: THEME_AUTHORIZATION_ERROR,
  }
}
