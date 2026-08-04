import { describe, expect, it } from "vitest"

import stagingProxy from "./staging-proxy"

describe("staging verification proxy", () => {
  it("forwards local requests under the canonical staging origin", async () => {
    const forwardedRequests: Array<Request> = []
    const request = new Request(
      "http://127.0.0.1:8790/api/v1/maintenance/orientations?limit=30",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://staging.coinarchive.app",
        },
        body: JSON.stringify({ code: "staging-e2e", name: "Staging E2E" }),
      }
    )

    const response = await stagingProxy.fetch(request, {
      STAGING_WEB: {
        fetch(forwardedRequest) {
          forwardedRequests.push(forwardedRequest)
          return Promise.resolve(new Response(null, { status: 204 }))
        },
      },
    })

    expect(response.status).toBe(204)
    expect(forwardedRequests).toHaveLength(1)
    expect(forwardedRequests[0]?.url).toBe(
      "https://staging.coinarchive.app/api/v1/maintenance/orientations?limit=30"
    )
    expect(forwardedRequests[0]?.method).toBe("POST")
    expect(forwardedRequests[0]?.headers.get("origin")).toBe(
      "https://staging.coinarchive.app"
    )
    await expect(forwardedRequests[0]?.json()).resolves.toStrictEqual({
      code: "staging-e2e",
      name: "Staging E2E",
    })
  })
})
