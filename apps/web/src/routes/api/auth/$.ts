import { createFileRoute } from "@tanstack/react-router"

import { proxyAuthRequest } from "@/lib/auth-proxy.server"
import { getPublicApiBaseUrl } from "@/lib/public-api.server"

export { proxyAuthRequest } from "@/lib/auth-proxy.server"

export async function handleAuthRequest({ request }: { request: Request }) {
  const { env } = await import("cloudflare:workers")

  return proxyAuthRequest(request, {
    apiBaseUrl: getPublicApiBaseUrl(),
    allowSignInAttempt: async (clientIp) =>
      (
        await env.AUTH_RATE_LIMITER.limit({
          key: `${env.CLOUDFLARE_ENV ?? "local"}:${clientIp}`,
        })
      ).success,
    fetchApi: env.AUTH_API.fetch.bind(env.AUTH_API),
  })
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handleAuthRequest,
      POST: handleAuthRequest,
    },
  },
})
