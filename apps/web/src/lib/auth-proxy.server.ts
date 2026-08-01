import "@tanstack/react-start/server-only"

type AuthProxyOptions = {
  apiBaseUrl: string
  fetchApi: (request: Request) => Promise<Response>
}

export async function proxyAuthRequest(
  request: Request,
  { apiBaseUrl, fetchApi }: AuthProxyOptions
) {
  const browserUrl = new URL(request.url)
  const apiUrl = new URL(
    `${browserUrl.pathname}${browserUrl.search}`,
    apiBaseUrl
  )
  const headers = new Headers(request.headers)
  const clientIp = headers.get("cf-connecting-ip")

  headers.set("x-forwarded-host", browserUrl.host)
  headers.set("x-forwarded-proto", browserUrl.protocol.slice(0, -1))
  if (clientIp === null) {
    headers.delete("x-forwarded-for")
  } else {
    headers.set("x-forwarded-for", clientIp)
  }

  const forwardedRequest = new Request(apiUrl, request)
  for (const [name, value] of headers) {
    forwardedRequest.headers.set(name, value)
  }

  return fetchApi(new Request(forwardedRequest, { redirect: "manual" }))
}
