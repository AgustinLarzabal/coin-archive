const AUTH_REDIRECT_FALLBACK = "/"
const AUTH_REDIRECT_ORIGIN = "http://coin-archive.local"

export function getSafeAuthRedirect(redirect: string | undefined): string {
  if (redirect === undefined || redirect === "") {
    return AUTH_REDIRECT_FALLBACK
  }

  if (!redirect.startsWith("/") || redirect.startsWith("//")) {
    return AUTH_REDIRECT_FALLBACK
  }

  try {
    const url = new URL(redirect, AUTH_REDIRECT_ORIGIN)

    if (url.origin !== AUTH_REDIRECT_ORIGIN) {
      return AUTH_REDIRECT_FALLBACK
    }

    return `${url.pathname}${url.search}${url.hash}` || AUTH_REDIRECT_FALLBACK
  } catch {
    return AUTH_REDIRECT_FALLBACK
  }
}

export function getAuthenticatedLoginRedirect(
  isSignedIn: boolean,
  redirect: string | undefined
): string | null {
  return isSignedIn ? getSafeAuthRedirect(redirect) : null
}
