import { authClient } from "@workspace/auth/client"
import { getSafeAuthRedirect } from "./auth-redirect"

export function startGoogleSignIn(callbackURL: string) {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: getSafeAuthRedirect(callbackURL),
  })
}
