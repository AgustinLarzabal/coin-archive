import "@tanstack/react-start/server-only"

import { getRequest } from "@tanstack/react-start/server"
import type { authClient } from "@coin-archive/auth/client"

import { proxyAuthRequest } from "./auth-proxy.server"
import { getPublicApiBaseUrl } from "./public-api.server"

type CollectorSession = typeof authClient.$Infer.Session

export async function getRequestAuthSession(): Promise<CollectorSession | null> {
  const { env } = await import("cloudflare:workers")
  const incomingRequest = getRequest()
  const sessionUrl = new URL("/api/auth/get-session", incomingRequest.url)
  const response = await proxyAuthRequest(
    new Request(sessionUrl, { headers: incomingRequest.headers }),
    {
      apiBaseUrl: getPublicApiBaseUrl(),
      allowSignInAttempt: async () => true,
      fetchApi: env.AUTH_API.fetch.bind(env.AUTH_API),
    }
  )

  if (!response.ok) {
    return null
  }

  return response.json()
}
