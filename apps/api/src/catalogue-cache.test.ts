import { afterEach, expect, it, vi } from "vitest"

import { fetchCatalogue } from "./catalogue-cache.js"

afterEach(() => vi.useRealTimers())

it("reuses catalogue reads by URL for at most 30 seconds without replaying request IDs", async () => {
  vi.useFakeTimers()
  const entries = new Map<string, { expiresAt: number; response: Response }>()
  const cache = {
    async match(request: Request) {
      const entry = entries.get(request.url)
      return entry && entry.expiresAt > Date.now()
        ? entry.response.clone()
        : undefined
    },
    async put(request: Request, response: Response) {
      expect(response.headers.get("cache-control")).toBe(
        "public, max-age=30, must-revalidate"
      )
      entries.set(request.url, {
        expiresAt: Date.now() + 30_000,
        response: response.clone(),
      })
    },
  }
  let backendCalls = 0
  const read = async (path: string, id: string) => {
    const request = new Request(`https://api.internal${path}`, {
      headers: { "x-request-id": id },
    })
    return fetchCatalogue(request, cache, async () => {
      backendCalls++
      return new Response(JSON.stringify({ call: backendCalls }), {
        headers: { "Cache-Control": "no-store", "x-request-id": id },
      })
    })
  }

  for (const path of [
    "/v1/coins?page=1&issuer=AR",
    "/v1/coins?page=2&issuer=AR",
    "/v1/coins?page=1&issuer=IT",
    "/v1/coins/by-slug/example",
    "/v1/issuers",
  ]) {
    const first = await read(path, "first")
    const second = await read(path, "second")
    expect(await second.text()).toBe(await first.text())
    expect(second.headers.get("x-request-id")).toBe("second")
    expect(second.headers.get("cache-control")).toBe("no-store")
  }
  expect(backendCalls).toBe(5)

  vi.advanceTimersByTime(30_000)
  await read("/v1/coins?page=1&issuer=AR", "after-expiry")
  expect(backendCalls).toBe(6)
})

it("keeps health, errors, and non-GET requests out of the cache", async () => {
  const cache = {
    match: vi.fn(async () => undefined),
    put: vi.fn(async () => {}),
  }
  let calls = 0
  for (const [path, method, status] of [
    ["/health", "GET", 200],
    ["/v1/coins", "POST", 200],
    ["/v1/coins", "GET", 500],
    ["/v1/coins/missing", "GET", 404],
  ] as const) {
    const request = new Request(`https://api.internal${path}`, { method })
    const response = await fetchCatalogue(request, cache, async () => {
      calls++
      return new Response("backend", {
        status,
        headers: { "Cache-Control": "no-store" },
      })
    })
    expect(response.status).toBe(status)
    expect(response.headers.get("cache-control")).toBe("no-store")
  }
  expect(calls).toBe(4)
  expect(cache.match).toHaveBeenCalledTimes(2)
  expect(cache.put).not.toHaveBeenCalled()
})

it("serves the backend response when the cache is unavailable", async () => {
  const response = await fetchCatalogue(
    new Request("https://api.internal/v1/coins"),
    {
      match: async () => {
        throw new Error("cache unavailable")
      },
      put: async () => {
        throw new Error("cache unavailable")
      },
    },
    async () => new Response("fresh", { status: 200 })
  )

  expect(response.status).toBe(200)
  expect(await response.text()).toBe("fresh")
})
