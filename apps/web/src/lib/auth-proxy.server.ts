import "@tanstack/react-start/server-only"

type AuthProxyOptions = {
  apiBaseUrl: string
  allowSignInAttempt: (clientIp: string) => Promise<boolean>
  createRequestId?: () => string
  fetchApi: (request: Request) => Promise<Response>
}

export async function proxyAuthRequest(
  request: Request,
  {
    apiBaseUrl,
    allowSignInAttempt,
    createRequestId = crypto.randomUUID,
    fetchApi,
  }: AuthProxyOptions
) {
  const browserUrl = new URL(request.url)
  const requestId = createRequestId()
  const responseHeaders = { "X-Request-ID": requestId }

  if (!isSafeMethod(request.method)) {
    if (request.headers.get("origin") !== browserUrl.origin) {
      return Response.json(
        { error: "Authentication mutation must be same-origin." },
        { status: 403, headers: responseHeaders }
      )
    }

    if (
      browserUrl.pathname.startsWith("/api/auth/sign-in/") &&
      !(await allowSignInAttempt(
        request.headers.get("cf-connecting-ip") ?? "unknown"
      ))
    ) {
      return Response.json(
        { error: "Too many authentication attempts." },
        {
          status: 429,
          headers: { ...responseHeaders, "Retry-After": "60" },
        }
      )
    }
  }

  const apiUrl = new URL(
    `${browserUrl.pathname}${browserUrl.search}`,
    apiBaseUrl
  )
  const headers = new Headers(request.headers)
  const clientIp = headers.get("cf-connecting-ip")

  headers.set("x-forwarded-host", browserUrl.host)
  headers.set("x-forwarded-proto", browserUrl.protocol.slice(0, -1))
  headers.set("x-request-id", requestId)
  if (clientIp === null) {
    headers.delete("x-forwarded-for")
  } else {
    headers.set("x-forwarded-for", clientIp)
  }

  const forwardedRequest = new Request(apiUrl, request)
  for (const [name, value] of headers) {
    forwardedRequest.headers.set(name, value)
  }

  const response = await fetchApi(
    new Request(forwardedRequest, { redirect: "manual" })
  )
  const headersForBrowser = new Headers(response.headers)
  headersForBrowser.set("X-Request-ID", requestId)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headersForBrowser,
  })
}

function isSafeMethod(method: string) {
  return method === "GET" || method === "HEAD" || method === "OPTIONS"
}
