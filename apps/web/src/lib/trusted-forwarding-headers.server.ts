import "@tanstack/react-start/server-only"

export function createTrustedForwardingHeaders(
  request: Request,
  requestId: string
) {
  const browserUrl = new URL(request.url)
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

  return headers
}
