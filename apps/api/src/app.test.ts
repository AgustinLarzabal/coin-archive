import { describe, expect, it, vi } from "vitest"
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

describe("/api/auth/*", () => {
  it("delegates session resolution to the API-hosted authentication backend", async () => {
    const handleAuthRequest = vi.fn(async (request: Request) => {
      expect(request.headers.get("cookie")).toBe(
        "better-auth.session_token=valid-session"
      )

      return Response.json({
        session: { id: "session-id" },
        user: { id: "collector-id", role: "editor" },
      })
    })
    const app = createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async () => coins,
      handleAuthRequest,
    })

    const response = await app.request(
      "https://api.coinarchive.app/api/auth/get-session",
      { headers: { Cookie: "better-auth.session_token=valid-session" } }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      user: { id: "collector-id", role: "editor" },
    })
    expect(handleAuthRequest).toHaveBeenCalledTimes(1)
  })

  it("preserves invalid-session responses from the authentication backend", async () => {
    const app = createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async () => coins,
      handleAuthRequest: async () => Response.json(null),
    })

    const response = await app.request(
      "https://api.coinarchive.app/api/auth/get-session",
      { headers: { Cookie: "better-auth.session_token=invalid-session" } }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toBeNull()
  })

  it("keeps authentication outside the anonymous public API rate limit", async () => {
    const rateLimit = vi.fn(async () => false)
    const app = createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async () => coins,
      rateLimit,
      handleAuthRequest: async () => Response.json(null),
    })

    const response = await app.request(
      "https://api.coinarchive.app/api/auth/get-session"
    )

    expect(response.status).toBe(200)
    expect(rateLimit).not.toHaveBeenCalled()
  })
})

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
    expect(method.headers.get("Allow")).toBe("GET, HEAD, OPTIONS")
    await expect(method.json()).resolves.toMatchObject({
      detail: "Only GET, HEAD, and OPTIONS are supported",
    })
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

describe("GET /api/v1/coins/:id", () => {
  it("returns a complete public Coin detail document and supports conditional requests", async () => {
    const app = createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async () => coins,
      getCoin: async () => ({
        id: coins[0].id,
        title: "First Coin",
        comments: "A public Coin Comment.",
        composition: {
          code: "cu-ni",
          name: "Copper-nickel",
        },
        compositionDescription: "75% copper, 25% nickel.",
        diameter: 25.75,
        distribution: { code: "commemorative", name: "Commemorative" },
        edge: { code: "reeded", name: "Reeded" },
        faceValue: {
          text: "2 Euros",
          numericValue: 2,
          currency: { code: "euro", name: "Euro", fullName: "Euro" },
        },
        isDemonetized: false,
        issuer: { code: "spain", isoCode: "ES", name: "Spain", parent: null },
        minYear: 2004,
        maxYear: 2004,
        mintage: 8_000_000,
        mints: [{ code: "madrid", name: "Madrid" }],
        orientation: { code: "medal", name: "Medal alignment" },
        references: [
          { catalogue: { code: "KM", title: "Krause-Mishler" }, number: "123" },
        ],
        rim: { code: "raised", name: "Raised" },
        rulers: [{ code: "felipe-vi", name: "Felipe VI" }],
        shape: { code: "round", name: "Round" },
        surfaces: {
          obverse: {
            description: "Portrait.",
            lettering: "FELIPE VI",
            imageUrl: "https://images.coinarchive.app/obverse.jpg",
            engravers: [{ code: "ana", name: "Ana" }],
          },
          reverse: null,
          edge: { description: null, lettering: null, imageUrl: null },
        },
        technique: { code: "milled", name: "Milled" },
        themes: [{ code: "history", name: "History" }],
        thickness: 2.2,
        weight: 8.5,
      }),
    })

    const response = await app.request(
      `https://api.coinarchive.app/api/v1/coins/${coins[0].id}`
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      data: {
        id: coins[0].id,
        comments: "A public Coin Comment.",
        composition: {
          code: "cu-ni",
          name: "Copper-nickel",
        },
        compositionDescription: "75% copper, 25% nickel.",
        diameter: "25.75",
        faceValue: { numericValue: "2" },
        mintage: "8000000",
        weight: "8.5",
        surfaces: {
          obverse: { imageUrl: "https://images.coinarchive.app/obverse.jpg" },
          reverse: null,
          edge: { imageUrl: null },
        },
      },
    })

    const conditional = await app.request(
      `https://api.coinarchive.app/api/v1/coins/${coins[0].id}`,
      {
        headers: { "If-None-Match": response.headers.get("ETag")! },
      }
    )
    expect(conditional.status).toBe(304)
  })

  it("returns public problem documents for invalid and unknown Coin UUIDs", async () => {
    const app = createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async () => coins,
      getCoin: async () => null,
    })

    for (const [id, status] of [
      ["not-a-uuid", 400],
      [coins[0].id, 404],
    ] as const) {
      const response = await app.request(
        `https://api.coinarchive.app/api/v1/coins/${id}`
      )
      expect(response.status).toBe(status)
      expect(response.headers.get("Content-Type")).toContain(
        "application/problem+json"
      )
      await expect(response.json()).resolves.toMatchObject({
        type: `https://api.coinarchive.app/problems/${status}`,
        status,
        title: expect.any(String),
        detail: expect.any(String),
        instance: `/api/v1/coins/${id}`,
        ...(status === 400
          ? { invalidParams: [{ name: "uuid", reason: expect.any(String) }] }
          : {}),
      })
    }
  })

  it("advertises every supported method for an unsupported detail request", async () => {
    const app = createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async () => coins,
    })

    const response = await app.request(
      `https://api.coinarchive.app/api/v1/coins/${coins[0].id}`,
      { method: "POST" }
    )

    expect(response.status).toBe(405)
    expect(response.headers.get("Content-Type")).toContain(
      "application/problem+json"
    )
    expect(response.headers.get("Allow")).toBe("GET, HEAD, OPTIONS")
  })
})

describe("GET /api/v1/openapi.json", () => {
  it("documents Coin detail and its public error responses from the shared contract", async () => {
    const app = createPublicApiApp({
      environment: "production",
      surfaceImageOrigin: "https://images.coinarchive.app",
      browseCoins: async () => coins,
    })

    const response = await app.request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    await expect(response.json()).resolves.toMatchObject({
      paths: {
        "/api/v1/coins/{uuid}": {
          get: {
            responses: {
              "200": expect.any(Object),
              "400": expect.any(Object),
              "404": expect.any(Object),
              "405": expect.any(Object),
            },
          },
        },
      },
    })
  })
})
