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
