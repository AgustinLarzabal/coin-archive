import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"

const distributions = [
  {
    id: "018f1a11-aaaa-7000-8000-000000000001",
    code: "silver",
    name: "Silver",
    version: 1,
    createdAt: new Date("2026-08-02T10:15:30.000Z"),
    updatedAt: new Date("2026-08-02T10:15:30.000Z"),
  },
  {
    id: "018f1a11-aaaa-7000-8000-000000000002",
    code: "gold",
    name: "Gold",
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
    listDistributions: async (input) =>
      distributions.map((distribution) => ({
        ...distribution,
        cursorValue: distribution[input.sort].toLowerCase(),
        cursorSecondaryValue:
          distribution[input.sort === "name" ? "code" : "name"].toLowerCase(),
      })),
    getDistribution: async (id) =>
      distributions.find((distribution) => distribution.id === id) ?? null,
    createDistribution: async ({ fields }) => ({
      status: "created" as const,
      distribution: {
        ...distributions[0],
        id: "018f1a11-aaaa-7000-8000-000000000003",
        ...fields,
      },
    }),
    replaceDistribution: async ({ id, fields }) => ({
      status: "updated" as const,
      distribution: { ...distributions[0], id, ...fields, version: 2 },
    }),
    deleteDistribution: async () => ({
      status: "deleted" as const,
      distribution: distributions[0],
    }),
    ...overrides,
  })
}

describe("protected Distribution maintenance reads", () => {
  it("enforces authentication and the Editor/Admin policy", async () => {
    for (const [app, status, code] of [
      [
        createApp({ getCollector: async () => null }),
        401,
        "authentication_required",
      ],
      [
        createApp({
          getCollector: async () => ({
            id: "collector-id",
            role: "collector",
          }),
        }),
        403,
        "editor_access_required",
      ],
    ] as const) {
      const response = await app.request(
        "https://api.coinarchive.app/api/v1/maintenance/distributions"
      )

      expect(response.status).toBe(status)
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      await expect(response.json()).resolves.toMatchObject({ code })
    }

    const adminResponse = await createApp({
      getCollector: async () => ({ id: "admin-id", role: "admin" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/distributions")
    expect(adminResponse.status).toBe(200)
  })

  it("returns cursor-paginated Distributions and compact options", async () => {
    const listDistributions = vi.fn(async () =>
      distributions.map((distribution) => ({
        ...distribution,
        cursorValue: distribution.name.toLowerCase(),
        cursorSecondaryValue: distribution.code.toLowerCase(),
      }))
    )
    const app = createApp({ listDistributions })
    const list = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/distributions?limit=1&q=silver&sort=name&order=asc"
    )

    expect(list.status).toBe(200)
    expect(list.headers.get("cache-control")).toBe("private, no-store")
    await expect(list.json()).resolves.toStrictEqual({
      data: [
        {
          ...distributions[0],
          createdAt: "2026-08-02T10:15:30.000Z",
          updatedAt: "2026-08-02T10:15:30.000Z",
          etag: '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      ],
      nextCursor: expect.any(String),
    })
    expect(listDistributions).toHaveBeenCalledWith({
      q: "silver",
      limit: 2,
      sort: "name",
      order: "asc",
    })

    const options = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/distributions/options?q=silver"
    )
    await expect(options.json()).resolves.toStrictEqual({
      data: distributions.map(({ id, code, name }) => ({ id, code, name })),
      nextCursor: null,
    })
  })

  it("returns mutable detail with an opaque ETag", async () => {
    const app = createApp()
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/distributions/${distributions[0].id}`
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    await expect(response.json()).resolves.toMatchObject({
      data: { id: distributions[0].id, version: 1 },
    })

    const missing = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/distributions/018f1a11-aaaa-7000-8000-000000000099"
    )
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toMatchObject({
      code: "distribution_not_found",
    })
  })

  it("rate-limits reads per authenticated Collector", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/distributions"
    )

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("60")
    expect(maintenanceRateLimit).toHaveBeenCalledWith("collector-id", "read")
  })
})

describe("protected Distribution maintenance mutations", () => {
  it("rate-limits mutations with the Collector mutation budget", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/distributions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "silver", name: "Silver" }),
      }
    )

    expect(response.status).toBe(429)
    expect(maintenanceRateLimit).toHaveBeenCalledWith(
      "collector-id",
      "mutation"
    )
  })

  it("creates with normalization, retry identity, and standard success headers", async () => {
    const createDistribution = vi.fn(async ({ fields }) => ({
      status: "created" as const,
      distribution: { ...distributions[0], ...fields },
    }))
    const response = await createApp({ createDistribution }).request(
      "https://api.coinarchive.app/api/v1/maintenance/distributions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: " silver ", name: " Silver " }),
      }
    )

    expect(response.status).toBe(201)
    expect(response.headers.get("location")).toBe(
      `/api/v1/maintenance/distributions/${distributions[0].id}`
    )
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(createDistribution).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: "collector-id",
        idempotencyKey: "attempt-1",
        requestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        fields: { code: "silver", name: "Silver" },
      })
    )
  })

  it("returns authoritative pointer-addressed validation", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/distributions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: " ", name: "A".repeat(256) }),
      }
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({
      title: "Distribution validation failed",
      code: "distribution_validation_failed",
      invalidParams: expect.arrayContaining([
        expect.objectContaining({
          name: "/code",
          code: "distribution_code_required",
        }),
        expect.objectContaining({
          name: "/name",
          code: "distribution_name_too_long",
        }),
      ]),
    })

    const invalidCode = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/distributions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-2",
        },
        body: JSON.stringify({ code: "Silver Alloy", name: "Silver" }),
      }
    )
    expect(invalidCode.status).toBe(422)
    await expect(invalidCode.json()).resolves.toMatchObject({
      invalidParams: [
        expect.objectContaining({
          name: "/code",
          code: "distribution_code_invalid",
        }),
      ],
    })
  })

  it("replays identical creates and rejects mismatched key reuse", async () => {
    const replayed = await createApp({
      createDistribution: async () => ({
        status: "replayed",
        distribution: distributions[0],
      }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/distributions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "silver", name: "Silver" }),
    })
    expect(replayed.status).toBe(201)

    const mismatch = await createApp({
      createDistribution: async () => ({ status: "mismatch" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/distributions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "gold", name: "Gold" }),
    })
    expect(mismatch.status).toBe(409)
    await expect(mismatch.json()).resolves.toMatchObject({
      code: "idempotency_key_reused",
    })
  })

  it("atomically replaces and deletes with opaque If-Match", async () => {
    const replaceDistribution = vi.fn(async ({ id, fields }) => ({
      status: "updated" as const,
      distribution: { ...distributions[0], id, ...fields, version: 2 },
    }))
    const deleteDistribution = vi.fn(async () => ({
      status: "deleted" as const,
      distribution: distributions[0],
    }))
    const app = createApp({ replaceDistribution, deleteDistribution })
    const ifMatch = '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"'
    const replace = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/distributions/${distributions[0].id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "If-Match": ifMatch },
        body: JSON.stringify({ code: "gold", name: "Gold" }),
      }
    )
    expect(replace.status).toBe(200)
    expect(replace.headers.get("etag")).not.toBe(ifMatch)
    expect(replaceDistribution).toHaveBeenCalledWith({
      id: distributions[0].id,
      expectedVersion: 1,
      fields: { code: "gold", name: "Gold" },
    })

    const deleted = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/distributions/${distributions[0].id}`,
      { method: "DELETE", headers: { "If-Match": ifMatch } }
    )
    expect(deleted.status).toBe(204)
    expect(await deleted.text()).toBe("")
  })

  it("reports stale writes, Distribution Code conflicts, and dependent-Coin conflicts", async () => {
    const stale = await createApp({
      replaceDistribution: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/distributions/${distributions[0].id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
        body: JSON.stringify({ code: "silver", name: "Silver" }),
      }
    )
    expect(stale.status).toBe(412)
    await expect(stale.json()).resolves.toMatchObject({
      code: "distribution_precondition_failed",
    })

    const staleDelete = await createApp({
      deleteDistribution: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/distributions/${distributions[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(staleDelete.status).toBe(412)
    await expect(staleDelete.json()).resolves.toMatchObject({
      code: "distribution_precondition_failed",
    })

    const duplicate = await createApp({
      createDistribution: async () => {
        throw {
          code: "23505",
          constraint_name: "distribution_code_lower_unique_idx",
        }
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/distributions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "silver", name: "Silver" }),
    })
    expect(duplicate.status).toBe(409)
    await expect(duplicate.json()).resolves.toMatchObject({
      code: "distribution_code_conflict",
    })

    const inUse = await createApp({
      deleteDistribution: async () => {
        throw {
          code: "23001",
          constraint_name: "coin_distribution_id_distribution_id_fk",
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/distributions/${distributions[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(inUse.status).toBe(409)
    await expect(inUse.json()).resolves.toMatchObject({
      code: "distribution_in_use",
    })
  })

  it("sanitizes unexpected persistence failures", async () => {
    const response = await createApp({
      createDistribution: async () => {
        throw new Error("postgresql://secret-database")
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/distributions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "silver", name: "Silver" }),
    })

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain("secret-database")
  })
})

describe("Distribution maintenance OpenAPI", () => {
  it("documents every Distribution operation as Collector-protected", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document: {
      paths: Record<
        string,
        Record<string, { security: unknown; tags: string[] }>
      >
    } = await response.json()
    const collection = document.paths["/api/v1/maintenance/distributions"]
    const detail = document.paths["/api/v1/maintenance/distributions/{uuid}"]

    expect(collection.get).toMatchObject({
      tags: ["Distribution Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(collection.post).toMatchObject({
      tags: ["Distribution Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(detail.get).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.put).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.delete).toMatchObject({
      security: [{ collectorSession: [] }],
    })
  })
})
