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
      return Response.json({ data: [], nextCursor: null })
    })

    const response = await proxyMaintenanceApiRequest(
      new Request(
        "https://coinarchive.app/api/v1/maintenance/orientations?limit=30",
        { headers: { Cookie: "better-auth.session_token=valid-session" } }
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
})
