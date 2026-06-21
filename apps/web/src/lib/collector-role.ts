import type { CollectorRole } from "@workspace/auth/client"
import { isCollectorRole } from "@workspace/auth/client"

type CollectorWithRole = {
  role?: string | null
}

export function getCollectorRole(
  collector: CollectorWithRole | null
): CollectorRole | null {
  if (
    collector === null ||
    collector.role === null ||
    collector.role === undefined
  ) {
    return null
  }

  return isCollectorRole(collector.role) ? collector.role : null
}
