import type { CollectorRole } from "@workspace/auth/client"
import { isCollectorRole } from "@workspace/auth/client"

export type CollectorWithRole = {
  role?: string | null
}

export function getCollectorRole(
  collector: CollectorWithRole | null
): CollectorRole | null {
  const role = collector?.role

  if (role === null || role === undefined) {
    return null
  }

  return isCollectorRole(role) ? role : null
}
