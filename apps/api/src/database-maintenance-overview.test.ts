import type { DatabaseMaintenanceOverview } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"

const counts: DatabaseMaintenanceOverview = {
  coins: 14,
  catalogues: 3,
  compositions: 5,
  currencies: 2,
  distributions: 4,
  edges: 7,
  rims: 11,
  shapes: 12,
  mintingTechniques: 9,
  engravers: 6,
  themes: 13,
  issuers: 8,
  rulers: 5,
  rulerGroups: 4,
  orientations: 10,
  mints: 9,
}

function createApp(
  overrides: Partial<Parameters<typeof createApiApp>[0]> = {}
) {
  return createApiApp({
    environment: "production",
    surfaceImageOrigin: "https://images.coinarchive.app",
    browseCoins: async () => [],
    getCollector: async () => ({ id: "collector-id", role: "editor" }),
    getDatabaseMaintenanceOverview: async () => counts,
    ...overrides,
  })
}

describe("protected Database Maintenance overview", () => {
  it("returns standard authorization problems without reading counts", async () => {
    for (const [collector, status, code] of [
      [null, 401, "authentication_required"],
      [
        { id: "collector-id", role: "collector" as const },
        403,
        "editor_access_required",
      ],
    ] as const) {
      const getDatabaseMaintenanceOverview = vi.fn(async () => counts)
      const response = await createApp({
        getCollector: async () => collector,
        getDatabaseMaintenanceOverview,
      }).request("https://api.coinarchive.app/api/v1/maintenance/overview")

      expect(response.status).toBe(status)
      expect(response.headers.get("content-type")).toContain(
        "application/problem+json"
      )
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      await expect(response.json()).resolves.toMatchObject({ code, status })
      expect(getDatabaseMaintenanceOverview).not.toHaveBeenCalled()
    }
  })

  it.each(["editor", "admin"] as const)(
    "returns current serialized counts to %ss with private no-store caching",
    async (role) => {
      const response = await createApp({
        getCollector: async () => ({ id: "collector-id", role }),
      }).request("https://api.coinarchive.app/api/v1/maintenance/overview")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      await expect(response.json()).resolves.toStrictEqual({ data: counts })
    }
  )

  it("keeps every section when all current counts are empty", async () => {
    const emptyCounts = Object.fromEntries(
      Object.keys(counts).map((key) => [key, 0])
    ) as DatabaseMaintenanceOverview
    const response = await createApp({
      getDatabaseMaintenanceOverview: async () => emptyCounts,
    }).request("https://api.coinarchive.app/api/v1/maintenance/overview")

    await expect(response.json()).resolves.toStrictEqual({ data: emptyCounts })
  })

  it("documents the protected overview without changing the public Coin route", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document: {
      paths: Record<
        string,
        Record<string, { tags: string[]; security: unknown }>
      >
    } = await response.json()

    expect(document.paths["/api/v1/maintenance/overview"].get).toMatchObject({
      tags: ["Database Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(document.paths["/api/v1/coins"].get).toMatchObject({
      tags: ["Coins"],
      security: [],
    })
  })
})
