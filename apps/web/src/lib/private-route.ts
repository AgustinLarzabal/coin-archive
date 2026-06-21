import { hasEditorAccess } from "@workspace/auth/client"

import { getCollectorRole } from "./collector-role"
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
