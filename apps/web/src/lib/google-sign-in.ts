import { authClient } from "@workspace/auth/client"
import { getSafeAuthRedirect } from "./auth-redirect"

export function startGoogleSignIn(redirectTarget: string) {
  const callbackURL = getSafeAuthRedirect(redirectTarget)

  return authClient.signIn.social({
    provider: "google",
    callbackURL,
  })
}
