import { describe, expect, it } from "vitest"
import { createMaintenanceApiClient, createPublicApiClient } from "./client"

describe("createPublicApiClient", () => {
  it("uses the supplied base URL and fetch implementation for Coin browsing", async () => {
    let requestedUrl = ""
    const client = createPublicApiClient({
      baseUrl: "https://api.example.test",
      fetch: async (input) => {
        requestedUrl = input instanceof Request ? input.url : String(input)
        return new Response(JSON.stringify({ data: [], nextCursor: null }), {
          headers: { "Content-Type": "application/json" },
        })
      },
    })

    await client.coins.browse({ issuer: "spain", limit: 30 })

    expect(requestedUrl).toBe(
      "https://api.example.test/api/v1/coins?issuer=spain&limit=30"
    )
  })

  it("uses the supplied base URL and fetch implementation for Coin detail", async () => {
    let requestedUrl = ""
    const client = createPublicApiClient({
      baseUrl: "https://api.example.test",
      fetch: async (input) => {
        requestedUrl = input instanceof Request ? input.url : String(input)
        return new Response(JSON.stringify({ data: {} }), {
          headers: { "Content-Type": "application/json" },
        })
      },
    })

    await client.coins.detail({
      uuid: "018f1a11-aaaa-7000-8000-000000000001",
    })

    expect(requestedUrl).toBe(
      "https://api.example.test/api/v1/coins/018f1a11-aaaa-7000-8000-000000000001"
    )
  })
})

describe("createMaintenanceApiClient", () => {
  it("uses the protected Orientation collection and detail routes", async () => {
    const requestedUrls: string[] = []
    const client = createMaintenanceApiClient({
      baseUrl: "https://coinarchive.app",
      fetch: async (input) => {
        requestedUrls.push(input instanceof Request ? input.url : String(input))
        const url = input instanceof Request ? input.url : String(input)

        return Response.json(
          url.endsWith("/options")
            ? { data: [], nextCursor: null }
            : url.includes("018f1a11-aaaa-7000-8000-000000000001")
              ? {
                  data: {
                    id: "018f1a11-aaaa-7000-8000-000000000001",
                    code: "coin-alignment",
                    name: "Coin alignment",
                    version: 1,
                    createdAt: "2026-08-02T10:15:30.000Z",
                    updatedAt: "2026-08-02T10:15:30.000Z",
                  },
                }
              : { data: [], nextCursor: null }
        )
      },
    })

    await client.orientations.list({ limit: 30, sort: "name" })
    await client.orientations.options({ q: "coin" })
    await client.orientations.detail({
      uuid: "018f1a11-aaaa-7000-8000-000000000001",
    })

    expect(requestedUrls).toStrictEqual([
      "https://coinarchive.app/api/v1/maintenance/orientations?limit=30&sort=name",
      "https://coinarchive.app/api/v1/maintenance/orientations/options?q=coin",
      "https://coinarchive.app/api/v1/maintenance/orientations/018f1a11-aaaa-7000-8000-000000000001",
    ])
  })
})
