import { getRequestId } from "./app.js"

const referencePaths = new Set([
  "/v1/compositions",
  "/v1/currencies",
  "/v1/distributions",
  "/v1/engravers",
  "/v1/issuers",
  "/v1/mints",
  "/v1/orientations",
  "/v1/rulers",
  "/v1/shapes",
  "/v1/tags",
  "/v1/techniques",
])

export async function fetchCatalogue(
  request: Request,
  cache: Pick<Cache, "match" | "put">,
  fetchBackend: () => Promise<Response>
): Promise<Response> {
  const path = new URL(request.url).pathname
  if (
    request.method !== "GET" ||
    (path !== "/v1/coins" &&
      !path.startsWith("/v1/coins/") &&
      !referencePaths.has(path))
  ) {
    return fetchBackend()
  }

  // The URL includes every filter and page; request headers do not affect catalogue data.
  const key = new Request(request.url)
  let cached: Response | undefined
  try {
    cached = await cache.match(key)
  } catch {
    // Cache failure must not change the API response.
  }
  if (cached) {
    const response = new Response(cached.body, cached)
    response.headers.set(
      "x-request-id",
      getRequestId(request.headers.get("x-request-id"))
    )
    response.headers.set("Cache-Control", "no-store")
    return response
  }

  const response = await fetchBackend()
  if (response.status === 200 && !response.headers.has("set-cookie")) {
    const stored = response.clone()
    stored.headers.set("Cache-Control", "public, max-age=60, must-revalidate")
    stored.headers.delete("x-request-id")
    try {
      await cache.put(key, stored)
    } catch {
      // Serving the fresh response is still safe when caching fails.
    }
  }
  return response
}
