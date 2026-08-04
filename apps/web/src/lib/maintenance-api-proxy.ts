import { createTrustedForwardingHeaders } from "./trusted-forwarding-headers.server"

type MaintenanceProxyOptions = {
  apiBaseUrl: string
  createRequestId?: () => string
  fetchApi: (request: Request) => Promise<Response>
}

export async function proxyMaintenanceApiRequest(
  request: Request,
  {
    apiBaseUrl,
    createRequestId = () => crypto.randomUUID(),
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
  if (
    !isSafeMaintenanceMethod(request.method) &&
    request.headers.get("origin") !== browserUrl.origin
  ) {
    return new Response(
      JSON.stringify({
        type: "https://api.coinarchive.app/problems/cross-origin-maintenance-mutation",
        title: "Same-origin request required",
        status: 403,
        detail: "Maintenance mutations must be sent from this web origin",
        instance: browserUrl.pathname,
        code: "same_origin_required",
        requestId,
      }),
      {
        status: 403,
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Type": "application/problem+json",
          "X-Request-ID": requestId,
        },
      }
    )
  }

  const apiUrl = new URL(
    `${browserUrl.pathname}${browserUrl.search}`,
    apiBaseUrl
  )
  const headers = createTrustedForwardingHeaders(request, requestId)
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

export function isSafeMaintenanceMethod(method: string) {
  return method === "GET" || method === "HEAD" || method === "OPTIONS"
}
