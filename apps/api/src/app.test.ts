import { describe, expect, it } from "vitest"
import { createPublicApiApp } from "./app"

const coins = [
  {
    id: "018f1a11-aaaa-7000-8000-000000000001",
    title: "First Coin",
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    issuer: { code: "spain", isoCode: "ES", name: "Spain" },
    surfaces: {
      obverse: { imageUrl: "https://images.coinarchive.app/first-obverse.jpg" },
      reverse: null,
      edge: null,
    },
  },
  {
    id: "018f1a11-aaaa-7000-8000-000000000002",
    title: "Second Coin",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    issuer: { code: "spain", isoCode: "ES", name: "Spain" },
    surfaces: { obverse: null, reverse: null, edge: null },
  },
]

describe("GET /api/v1/coins", () => {
  it("returns compact Coin summaries with cache validation and a stable next cursor", async () => {
    const app = createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async () => coins,
    })

    const response = await app.request(
      "https://api.coinarchive.app/api/v1/coins?limit=1"
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=60, s-maxage=300, stale-while-revalidate=86400"
    )
    expect(body).toMatchObject({
      data: [
        {
          id: coins[0].id,
          title: "First Coin",
          detailUrl: `https://api.coinarchive.app/api/v1/coins/${coins[0].id}`,
        },
      ],
      nextCursor: expect.any(String),
    })

    const conditional = await app.request(
      "https://api.coinarchive.app/api/v1/coins?limit=1",
      {
        headers: { "If-None-Match": response.headers.get("ETag")! },
      }
    )
    expect(conditional.status).toBe(304)
  })

  it("rejects repeated or blank query parameters", async () => {
    const app = createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async () => coins,
    })

    for (const url of [
      "https://api.coinarchive.app/api/v1/coins?issuer=spain&issuer=france",
      "https://api.coinarchive.app/api/v1/coins?q=%20%20",
    ]) {
      const response = await app.request(url)
      expect(response.status).toBe(400)
      expect(response.headers.get("Content-Type")).toContain(
        "application/problem+json"
      )
    }
  })

  it("uses restrictive CORS and standard problem responses for limits and methods", async () => {
    const app = createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async () => coins,
      rateLimit: async () => false,
    })

    const limited = await app.request(
      "https://api.coinarchive.app/api/v1/coins",
      {
        headers: { Origin: "https://coinarchive.app" },
      }
    )
    expect(limited.status).toBe(429)
    expect(limited.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://coinarchive.app"
    )
    expect(limited.headers.get("Retry-After")).toBe("60")

    const method = await createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async () => coins,
    }).request("https://api.coinarchive.app/api/v1/coins", { method: "POST" })
    expect(method.status).toBe(405)
  })

  it("passes all active filters to the Coin browse source and excludes cross-environment images", async () => {
    let received: unknown
    const app = createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async (input) => {
        received = input
        return [
          {
            ...coins[0],
            surfaces: {
              obverse: {
                imageUrl: "https://images.staging.coinarchive.app/private.jpg",
              },
              reverse: null,
              edge: null,
            },
          },
        ]
      },
    })

    const response = await app.request(
      "https://api.coinarchive.app/api/v1/coins?q=first&issuer=spain&ruler=felipe&theme=map&engraver=ana&distribution=commemorative"
    )
    const body = await response.json()

    expect(received).toMatchObject({
      q: "first",
      issuer: "spain",
      ruler: "felipe",
      theme: "map",
      engraver: "ana",
      distribution: "commemorative",
    })
    expect(body).toMatchObject({ data: [{ surfaceImages: { obverse: null } }] })
  })
})
