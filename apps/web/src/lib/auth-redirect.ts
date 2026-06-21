export function getSafeAuthRedirect(redirect: string | undefined): string {
  if (redirect === undefined || redirect === "" || !redirect.startsWith("/")) {
    return "/"
  }

  if (redirect.startsWith("//")) {
    return "/"
  }

  try {
    const url = new URL(redirect, "http://coin-archive.local")

    if (url.origin !== "http://coin-archive.local") {
      return "/"
    }

    return `${url.pathname}${url.search}${url.hash}` || "/"
  } catch {
    return "/"
  }
}

export function getAuthenticatedLoginRedirect(
  isSignedIn: boolean,
  redirect: string | undefined
): string | null {
  return isSignedIn ? getSafeAuthRedirect(redirect) : null
}
