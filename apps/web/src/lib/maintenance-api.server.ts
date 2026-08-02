import "@tanstack/react-start/server-only"

import { createMaintenanceApiClient } from "@coin-archive/api"
import { getRequest } from "@tanstack/react-start/server"

import { getPublicApiBaseUrl } from "./public-api.server"

type MaintenanceProxyOptions = {
  apiBaseUrl: string
  createRequestId?: () => string
  fetchApi: (request: Request) => Promise<Response>
}

export async function proxyMaintenanceApiRequest(
  request: Request,
  {
    apiBaseUrl,
    createRequestId = crypto.randomUUID,
    fetchApi,
  }: MaintenanceProxyOptions
) {
  const browserUrl = new URL(request.url)
  if (!browserUrl.pathname.startsWith("/api/v1/maintenance/")) {
    return Response.json(
      { error: "Maintenance route not found." },
      { status: 404 }
    )
  }

  const requestId = createRequestId()
  const apiUrl = new URL(
    `${browserUrl.pathname}${browserUrl.search}`,
    apiBaseUrl
  )
  const headers = new Headers(request.headers)
  headers.set("x-request-id", requestId)

  const forwardedRequest = new Request(apiUrl, request)
  const response = await fetchApi(
    new Request(forwardedRequest, { headers, redirect: "manual" })
  )
  const responseHeaders = new Headers(response.headers)
  responseHeaders.set("X-Request-ID", requestId)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

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

      return proxyMaintenanceApiRequest(request, {
        apiBaseUrl: getPublicApiBaseUrl(),
        fetchApi: env.AUTH_API.fetch.bind(env.AUTH_API),
      })
    },
  })
}
