import { describe, expect, it } from "vitest"
import { createPublicApiClient } from "./client"

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
