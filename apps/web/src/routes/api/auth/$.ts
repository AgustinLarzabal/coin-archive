import { createFileRoute } from "@tanstack/react-router"

import { proxyAuthRequest } from "@/lib/auth-proxy.server"
import { getPublicApiBaseUrl } from "@/lib/public-api.server"

export { proxyAuthRequest } from "@/lib/auth-proxy.server"

export function handleAuthRequest({ request }: { request: Request }) {
  return proxyAuthRequest(request, {
    apiBaseUrl: getPublicApiBaseUrl(),
    fetchApi: globalThis.fetch.bind(globalThis),
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
