import type { CollectorRole } from "@coin-archive/auth/client"
import { isCollectorRole } from "@coin-archive/auth/client"

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
