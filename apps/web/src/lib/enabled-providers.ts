import type { OAuthProvider } from "@workspace/auth/client"

export function getEnabledProviders(): Array<OAuthProvider> {
  return ([["google", import.meta.env.VITE_AUTH_GOOGLE_ENABLED]] as const)
    .filter(([, flag]) => flag === "true" || flag === "1")
    .map(([name]) => name)
}
