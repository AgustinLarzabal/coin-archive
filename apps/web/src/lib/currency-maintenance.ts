import { hasEditorAccess } from "@workspace/auth/client"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"

export const CURRENCY_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Currencies."

export type CurrencyAuthorizationErrorResult = {
  status: "error"
  formError: typeof CURRENCY_AUTHORIZATION_ERROR
}

export function createCurrencyAuthorizationError(): CurrencyAuthorizationErrorResult {
  return {
    status: "error",
    formError: CURRENCY_AUTHORIZATION_ERROR,
  }
}

export function hasCurrencyMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}
