import handler from "@tanstack/react-start/server-entry"
import { afterEach, describe, expect, it, vi } from "vitest"

import server from "./server"
import { env } from "@/test/cloudflare-workers"

vi.mock("@tanstack/react-start/server-entry", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { fetch: vi.fn() },
}))

afterEach(() => vi.restoreAllMocks())

function request(path: string, ip?: string) {
  return new Request(`https://archive.example${path}`, {
    headers: ip ? { "CF-Connecting-IP": ip } : undefined,
  })
}

describe("public Archive requests", () => {
  it.each(["/explore", "/_serverFn/coins"])(
    "rejects excess requests to %s before catalogue work",
    async (path) => {
      vi.spyOn(env.ARCHIVE_RATE_LIMIT, "limit").mockResolvedValue({
        success: false,
      })
      const privateApi = vi.spyOn(env.API, "fetch")
      const rejectedLog = vi.spyOn(console, "warn").mockImplementation(() => {})

      const response = await server.fetch(request(path, "192.0.2.1"))

      expect(response.status).toBe(429)
      expect(response.headers.get("Retry-After")).toBe("60")
      expect(response.headers.get("Cache-Control")).toBe("no-store")
      expect(handler.fetch).not.toHaveBeenCalled()
      expect(privateApi).not.toHaveBeenCalled()
      expect(rejectedLog).toHaveBeenCalledWith("archive_request", {
        status: 429,
      })
    }
  )

  it("allows ordinary requests from separate and shared networks", async () => {
    const limit = vi.spyOn(env.ARCHIVE_RATE_LIMIT, "limit")
    const privateApi = vi
      .spyOn(env.API, "fetch")
      .mockResolvedValue(new Response("Catalogue"))
    vi.mocked(handler.fetch).mockImplementation(() =>
      env.API.fetch(new Request("https://api.internal/v1/coins"))
    )

    for (const ip of ["192.0.2.1", "192.0.2.1", "198.51.100.2"]) {
      const response = await server.fetch(request("/explore", ip))
      expect(response.status).toBe(200)
    }

    expect(limit).toHaveBeenNthCalledWith(1, { key: "192.0.2.1" })
    expect(limit).toHaveBeenNthCalledWith(3, { key: "198.51.100.2" })
    expect(privateApi).toHaveBeenCalledTimes(3)
  })

  it("fails closed without the edge caller even when forwarding headers are supplied", async () => {
    const rejectedLog = vi.spyOn(console, "error").mockImplementation(() => {})
    const response = await server.fetch(
      new Request("https://archive.example/explore", {
        headers: { "X-Forwarded-For": "192.0.2.1" },
      })
    )

    expect(response.status).toBe(503)
    expect(handler.fetch).not.toHaveBeenCalled()
    expect(rejectedLog).toHaveBeenCalledWith("archive_request", {
      status: 503,
    })
  })
})
