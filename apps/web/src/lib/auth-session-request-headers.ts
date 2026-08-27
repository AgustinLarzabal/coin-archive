export function createSessionRequestHeaders(incomingHeaders: Headers) {
  const headers = new Headers()

  for (const name of ["cookie", "user-agent"]) {
    const value = incomingHeaders.get(name)
    if (value !== null) headers.set(name, value)
  }

  return headers
}
