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
  collector: { role?: string | null } | null,
  redirectTarget: string
): EditorRouteAccess {
  const loginRedirect = getCollectorRouteRedirect(
    collector !== null,
    redirectTarget
  )

  if (loginRedirect !== null) {
    return loginRedirect
  }

  if (collector === null) {
    return {
      isAllowed: false,
    }
  }

  return {
    isAllowed:
      collector.role !== null &&
      collector.role !== undefined &&
      isCollectorRole(collector.role) &&
      hasEditorAccess(collector.role),
  }
}
