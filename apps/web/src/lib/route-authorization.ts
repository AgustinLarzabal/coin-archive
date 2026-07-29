import { hasEditorAccess } from "@coin-archive/auth/client"

import { getCollectorRole } from "./collector-role"
import type { CollectorWithRole } from "./collector-role"
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
      isAllowed: false
    }
  | {
      isAllowed: true
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

export function getEditorRouteAuthorization(
  collector: CollectorWithRole | null
): EditorRouteAccess {
  const role = getCollectorRole(collector)

  if (role === null || !hasEditorAccess(role)) {
    return {
      isAllowed: false,
    }
  }

  return {
    isAllowed: true,
  }
}
