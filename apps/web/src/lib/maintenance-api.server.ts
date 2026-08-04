import "@tanstack/react-start/server-only"

import { createMaintenanceApiClient } from "@coin-archive/api"
import { getRequest } from "@tanstack/react-start/server"

import {
  isSafeMaintenanceMethod,
  proxyMaintenanceApiRequest,
} from "./maintenance-api-proxy"
import { getPublicApiBaseUrl } from "./public-api.server"

export { proxyMaintenanceApiRequest } from "./maintenance-api-proxy"

export async function getMaintenanceApiClient() {
  const { env } = await import("cloudflare:workers")
  const incomingRequest = getRequest()

  return createMaintenanceApiClient({
    baseUrl: new URL(incomingRequest.url).origin,
    fetch: async (input, init) => {
      const request =
        input instanceof Request
          ? new Request(input, init)
          : new Request(input, init)

      if (!request.headers.has("cookie")) {
        const cookie = incomingRequest.headers.get("cookie")
        if (cookie !== null) request.headers.set("cookie", cookie)
      }
      if (
        !isSafeMaintenanceMethod(request.method) &&
        !request.headers.has("origin")
      ) {
        const origin = incomingRequest.headers.get("origin")
        if (origin !== null) request.headers.set("origin", origin)
      }

      return proxyMaintenanceApiRequest(request, {
        apiBaseUrl: getPublicApiBaseUrl(),
        fetchApi: env.AUTH_API.fetch.bind(env.AUTH_API),
      })
    },
  })
}
