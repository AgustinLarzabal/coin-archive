import { authClient } from "@workspace/auth/client"

export function startGoogleSignIn(callbackURL: string) {
  return authClient.signIn.social({
    provider: "google",
    callbackURL,
  })
}
