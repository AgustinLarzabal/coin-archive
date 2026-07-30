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
})
