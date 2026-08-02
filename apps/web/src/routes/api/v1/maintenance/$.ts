import { createFileRoute } from "@tanstack/react-router"

import { proxyMaintenanceApiRequest } from "@/lib/maintenance-api.server"
import { getPublicApiBaseUrl } from "@/lib/public-api.server"

export async function handleMaintenanceApiRequest({
  request,
}: {
  request: Request
}) {
  const { env } = await import("cloudflare:workers")

  return proxyMaintenanceApiRequest(request, {
    apiBaseUrl: getPublicApiBaseUrl(),
    fetchApi: env.AUTH_API.fetch.bind(env.AUTH_API),
  })
}

export const Route = createFileRoute("/api/v1/maintenance/$")({
  server: {
    handlers: {
      DELETE: handleMaintenanceApiRequest,
      GET: handleMaintenanceApiRequest,
      HEAD: handleMaintenanceApiRequest,
      OPTIONS: handleMaintenanceApiRequest,
      POST: handleMaintenanceApiRequest,
      PUT: handleMaintenanceApiRequest,
    },
  },
})
