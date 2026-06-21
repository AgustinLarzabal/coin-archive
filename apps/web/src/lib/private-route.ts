import type { CollectorRole } from "@workspace/auth/client"
import { hasEditorAccess, isCollectorRole } from "@workspace/auth/client"

import { getSafeAuthRedirect } from "./auth-redirect"

type CollectorRouteRedirect =
  | {
      search: {
        redirect: string
      }
      to: "/login"
    }
  | {
      to: "/login"
    }

type EditorRouteAccess =
  | {
      isAllowed: boolean
    }
  | CollectorRouteRedirect

type CollectorWithRole = {
  role?: string | null
}

function getCollectorRole(
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

export function getCollectorRouteRedirect(
  isSignedIn: boolean,
  redirectTarget: string
): CollectorRouteRedirect | null {
  if (isSignedIn) {
    return null
  }

  const safeRedirectTarget = getSafeAuthRedirect(redirectTarget)

  if (safeRedirectTarget === "/") {
    return {
      to: "/login",
    }
  }

  return {
    search: {
      redirect: safeRedirectTarget,
    },
    to: "/login",
  }
}

export function getEditorRouteAccess(
  collector: CollectorWithRole | null,
  redirectTarget: string
): EditorRouteAccess {
  const loginRedirect = getCollectorRouteRedirect(
    collector !== null,
    redirectTarget
  )

  if (loginRedirect !== null) {
    return loginRedirect
  }

  const role = getCollectorRole(collector)

  return {
    isAllowed: role !== null && hasEditorAccess(role),
  }
}
