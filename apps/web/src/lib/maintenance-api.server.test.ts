import { describe, expect, it, vi } from "vitest"

import { proxyMaintenanceApiRequest } from "./maintenance-api.server"

describe("proxyMaintenanceApiRequest", () => {
  it("forwards same-origin maintenance transport and credentials to the API binding", async () => {
    const fetchApi = vi.fn(async (request: Request) => {
      expect(request.url).toBe(
        "https://api.coinarchive.app/api/v1/maintenance/orientations?limit=30"
      )
      expect(request.headers.get("cookie")).toBe(
        "better-auth.session_token=valid-session"
      )
      expect(request.headers.get("x-request-id")).toBe("request-id")
      expect(request.headers.get("x-forwarded-host")).toBe("coinarchive.app")
      expect(request.headers.get("x-forwarded-proto")).toBe("https")
      expect(request.headers.get("x-forwarded-for")).toBe("203.0.113.9")
      return Response.json({ data: [], nextCursor: null })
    })

    const response = await proxyMaintenanceApiRequest(
      new Request(
        "https://coinarchive.app/api/v1/maintenance/orientations?limit=30",
        {
          headers: {
            Cookie: "better-auth.session_token=valid-session",
            "CF-Connecting-IP": "203.0.113.9",
            "X-Forwarded-For": "198.51.100.4",
            "X-Forwarded-Host": "attacker.example",
            "X-Forwarded-Proto": "http",
            "X-Request-ID": "spoofed-request-id",
          },
        }
      ),
      {
        apiBaseUrl: "https://api.coinarchive.app",
        createRequestId: () => "request-id",
        fetchApi,
      }
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toBe("request-id")
    expect(fetchApi).toHaveBeenCalledTimes(1)
  })

  it("rejects attempts to proxy paths outside maintenance", async () => {
    const fetchApi = vi.fn()
    const response = await proxyMaintenanceApiRequest(
      new Request("https://coinarchive.app/api/v1/coins"),
      {
        apiBaseUrl: "https://api.coinarchive.app",
        fetchApi,
      }
    )

    expect(response.status).toBe(404)
    expect(fetchApi).not.toHaveBeenCalled()
  })

  it("forwards mutation methods, preconditions, idempotency keys, and bodies unchanged", async () => {
    const fetchApi = vi.fn(async (request: Request) => {
      expect(request.method).toBe("PUT")
      expect(request.headers.get("if-match")).toBe('"opaque-version"')
      expect(request.headers.get("idempotency-key")).toBe("attempt-1")
      await expect(request.json()).resolves.toStrictEqual({
        code: "reeded",
        name: "Reeded",
      })
      return Response.json({ data: { id: "orientation-id" } })
    })

    await proxyMaintenanceApiRequest(
      new Request(
        "https://coinarchive.app/api/v1/maintenance/orientations/orientation-id",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "If-Match": '"opaque-version"',
            "Idempotency-Key": "attempt-1",
            Origin: "https://coinarchive.app",
          },
          body: JSON.stringify({ code: "reeded", name: "Reeded" }),
        }
      ),
      {
        apiBaseUrl: "https://api.coinarchive.app",
        fetchApi,
      }
    )

    expect(fetchApi).toHaveBeenCalledTimes(1)
  })

  it("rejects cross-origin mutations without forwarding credentials", async () => {
    const fetchApi = vi.fn()
    const response = await proxyMaintenanceApiRequest(
      new Request(
        "https://coinarchive.app/api/v1/maintenance/orientations/orientation-id",
        {
          method: "DELETE",
          headers: {
            Cookie: "better-auth.session_token=valid-session",
            Origin: "https://attacker.example",
          },
        }
      ),
      {
        apiBaseUrl: "https://api.coinarchive.app",
        createRequestId: () => "request-id",
        fetchApi,
      }
    )

    expect(response.status).toBe(403)
    expect(response.headers.get("content-type")).toContain(
      "application/problem+json"
    )
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(response.headers.get("x-request-id")).toBe("request-id")
    await expect(response.json()).resolves.toMatchObject({
      type: "https://api.coinarchive.app/problems/cross-origin-maintenance-mutation",
      code: "same_origin_required",
      requestId: "request-id",
    })
    expect(fetchApi).not.toHaveBeenCalled()
  })
})
