import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"

const orientations = [
  {
    id: "018f1a11-aaaa-7000-8000-000000000001",
    code: "coin-alignment",
    name: "Coin alignment",
    version: 1,
    createdAt: new Date("2026-08-02T10:15:30.000Z"),
    updatedAt: new Date("2026-08-02T10:15:30.000Z"),
  },
  {
    id: "018f1a11-aaaa-7000-8000-000000000002",
    code: "medal-alignment",
    name: "Medal alignment",
    version: 2,
    createdAt: new Date("2026-08-02T10:16:30.000Z"),
    updatedAt: new Date("2026-08-02T10:17:30.000Z"),
  },
]

function createApp(
  overrides: Partial<Parameters<typeof createApiApp>[0]> = {}
) {
  return createApiApp({
    environment: "production",
    surfaceImageOrigin: "https://images.coinarchive.app",
    browseCoins: async () => [],
    getCollector: async () => ({ id: "collector-id", role: "editor" }),
    listOrientations: async (input) =>
      orientations.map((orientation) => ({
        ...orientation,
        cursorValue: orientation[input.sort].toLowerCase(),
        cursorSecondaryValue:
          orientation[input.sort === "name" ? "code" : "name"].toLowerCase(),
      })),
    getOrientation: async (id) =>
      orientations.find((orientation) => orientation.id === id) ?? null,
    ...overrides,
  })
}

describe("protected Orientation maintenance reads", () => {
  it("distinguishes missing authentication from insufficient Editor access", async () => {
    const signedOut = createApp({ getCollector: async () => null })
    const collectorOnly = createApp({
      getCollector: async () => ({ id: "collector-id", role: "collector" }),
    })

    for (const [app, status] of [
      [signedOut, 401],
      [collectorOnly, 403],
    ] as const) {
      const response = await app.request(
        "https://api.coinarchive.app/api/v1/maintenance/orientations"
      )

      expect(response.status).toBe(status)
      expect(response.headers.get("content-type")).toContain(
        "application/problem+json"
      )
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      await expect(response.json()).resolves.toMatchObject({
        code:
          status === 401 ? "authentication_required" : "editor_access_required",
      })
    }
  })

  it("allows Admins to read current Orientation data", async () => {
    const app = createApp({
      getCollector: async () => ({ id: "admin-id", role: "admin" }),
    })

    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          id: orientations[0].id,
          version: orientations[0].version,
        }),
      ]),
    })
  })

  it("returns a private paginated collection with an opaque cursor", async () => {
    const listOrientations = vi.fn(async () =>
      orientations.map((orientation) => ({
        ...orientation,
        cursorValue: orientation.name.toLowerCase(),
        cursorSecondaryValue: orientation.code.toLowerCase(),
      }))
    )
    const app = createApp({ listOrientations })
    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations?limit=1&q=alignment&sort=name&order=asc",
      { headers: { Origin: "https://coinarchive.app" } }
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(response.headers.get("access-control-allow-origin")).toBeNull()
    await expect(response.json()).resolves.toStrictEqual({
      data: [
        {
          ...orientations[0],
          createdAt: "2026-08-02T10:15:30.000Z",
          updatedAt: "2026-08-02T10:15:30.000Z",
        },
      ],
      nextCursor: expect.any(String),
    })
    expect(listOrientations).toHaveBeenCalledWith({
      q: "alignment",
      limit: 2,
      sort: "name",
      order: "asc",
    })
  })

  it("returns compact searchable options", async () => {
    const listOrientations = vi.fn(async () =>
      orientations.map((orientation) => ({
        ...orientation,
        cursorValue: orientation.name.toLowerCase(),
        cursorSecondaryValue: orientation.code.toLowerCase(),
      }))
    )
    const app = createApp({ listOrientations })
    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations/options?q=coin"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toStrictEqual({
      data: orientations.map(({ id, code, name }) => ({ id, code, name })),
      nextCursor: null,
    })
    expect(listOrientations).toHaveBeenCalledWith({
      q: "coin",
      limit: 31,
      sort: "name",
      order: "asc",
    })
  })

  it("returns current detail with an opaque ETag and a declared not-found problem", async () => {
    const app = createApp()
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/orientations/${orientations[0].id}`
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    await expect(response.json()).resolves.toStrictEqual({
      data: {
        ...orientations[0],
        createdAt: "2026-08-02T10:15:30.000Z",
        updatedAt: "2026-08-02T10:15:30.000Z",
      },
    })

    const missing = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations/018f1a11-aaaa-7000-8000-000000000099"
    )
    expect(missing.status).toBe(404)
    expect(missing.headers.get("content-type")).toContain(
      "application/problem+json"
    )
  })

  it("rejects malformed collection cursors at the HTTP boundary", async () => {
    const app = createApp()
    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations?cursor=not-a-cursor"
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_request",
      status: 400,
      title: "Invalid query parameters",
    })
  })

  it("rate-limits protected reads per authenticated Collector", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const app = createApp({ maintenanceRateLimit })
    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations"
    )

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("60")
    expect(maintenanceRateLimit).toHaveBeenCalledWith("collector-id")
  })

  it("sanitizes unexpected protected-read failures", async () => {
    const app = createApp({
      listOrientations: async () => {
        throw new Error("postgresql://secret-database")
      },
    })
    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations"
    )

    expect(response.status).toBe(500)
    expect(response.headers.get("content-type")).toContain(
      "application/problem+json"
    )
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(await response.text()).not.toContain("secret-database")
  })
})

describe("combined OpenAPI document", () => {
  it("tags public and protected operations with correct per-operation security", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document: {
      components: { securitySchemes: Record<string, unknown> }
      paths: Record<
        string,
        Record<string, { security: unknown; tags: string[] }>
      >
    } = await response.json()

    expect(document.components.securitySchemes).toHaveProperty(
      "collectorSession"
    )
    expect(document.paths["/api/v1/coins"].get).toMatchObject({
      tags: ["Coins"],
      security: [],
    })
    expect(
      document.paths["/api/v1/maintenance/orientations"].get
    ).toMatchObject({
      tags: ["Orientation Maintenance"],
      security: [{ collectorSession: [] }],
    })
  })
})
