import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"

const catalogues = [
  {
    id: "018f1a11-aaaa-7000-8000-000000000001",
    code: "KM",
    title: "Standard Catalog of World Coins",
    version: 1,
    createdAt: new Date("2026-08-02T10:15:30.000Z"),
    updatedAt: new Date("2026-08-02T10:15:30.000Z"),
  },
  {
    id: "018f1a11-aaaa-7000-8000-000000000002",
    code: "RIC",
    title: "Roman Imperial Coinage",
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
    listCatalogues: async (input) =>
      catalogues.map((catalogue) => ({
        ...catalogue,
        cursorValue: catalogue[input.sort].toLowerCase(),
        cursorSecondaryValue:
          catalogue[input.sort === "title" ? "code" : "title"].toLowerCase(),
      })),
    getCatalogue: async (id) =>
      catalogues.find((catalogue) => catalogue.id === id) ?? null,
    createCatalogue: async ({ fields }) => ({
      status: "created" as const,
      catalogue: {
        ...catalogues[0],
        id: "018f1a11-aaaa-7000-8000-000000000003",
        ...fields,
      },
    }),
    replaceCatalogue: async ({ id, fields }) => ({
      status: "updated" as const,
      catalogue: { ...catalogues[0], id, ...fields, version: 2 },
    }),
    deleteCatalogue: async () => ({
      status: "deleted" as const,
      catalogue: catalogues[0],
    }),
    ...overrides,
  })
}

describe("protected Catalogue maintenance reads", () => {
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
        "https://api.coinarchive.app/api/v1/maintenance/catalogues"
      )

      expect(response.status).toBe(status)
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      await expect(response.json()).resolves.toMatchObject({ code })
    }

    const adminResponse = await createApp({
      getCollector: async () => ({ id: "admin-id", role: "admin" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/catalogues")
    expect(adminResponse.status).toBe(200)
  })

  it("returns cursor-paginated Catalogues and compact options", async () => {
    const listCatalogues = vi.fn(async () =>
      catalogues.map((catalogue) => ({
        ...catalogue,
        cursorValue: catalogue.title.toLowerCase(),
        cursorSecondaryValue: catalogue.code.toLowerCase(),
      }))
    )
    const app = createApp({ listCatalogues })
    const list = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/catalogues?limit=1&q=coin&sort=title&order=asc"
    )

    expect(list.status).toBe(200)
    expect(list.headers.get("cache-control")).toBe("private, no-store")
    await expect(list.json()).resolves.toStrictEqual({
      data: [
        {
          ...catalogues[0],
          createdAt: "2026-08-02T10:15:30.000Z",
          updatedAt: "2026-08-02T10:15:30.000Z",
          etag: '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      ],
      nextCursor: expect.any(String),
    })
    expect(listCatalogues).toHaveBeenCalledWith({
      q: "coin",
      limit: 2,
      sort: "title",
      order: "asc",
    })

    const options = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/catalogues/options?q=coin"
    )
    await expect(options.json()).resolves.toStrictEqual({
      data: catalogues.map(({ id, code, title }) => ({ id, code, title })),
      nextCursor: null,
    })
  })

  it("returns mutable detail with an opaque ETag", async () => {
    const app = createApp()
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/catalogues/${catalogues[0].id}`
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    await expect(response.json()).resolves.toMatchObject({
      data: { id: catalogues[0].id, version: 1 },
    })

    const missing = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/catalogues/018f1a11-aaaa-7000-8000-000000000099"
    )
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toMatchObject({
      code: "catalogue_not_found",
    })
  })

  it("rate-limits reads per authenticated Collector", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/catalogues"
    )

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("60")
    expect(maintenanceRateLimit).toHaveBeenCalledWith("collector-id", "read")
  })
})

describe("protected Catalogue maintenance mutations", () => {
  it("rate-limits mutations with the Collector mutation budget", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/catalogues",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "KM", title: "World Coins" }),
      }
    )

    expect(response.status).toBe(429)
    expect(maintenanceRateLimit).toHaveBeenCalledWith(
      "collector-id",
      "mutation"
    )
  })

  it("creates with normalization, retry identity, and standard success headers", async () => {
    const createCatalogue = vi.fn(async ({ fields }) => ({
      status: "created" as const,
      catalogue: { ...catalogues[0], ...fields },
    }))
    const response = await createApp({ createCatalogue }).request(
      "https://api.coinarchive.app/api/v1/maintenance/catalogues",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: " KM ", title: " World Coins " }),
      }
    )

    expect(response.status).toBe(201)
    expect(response.headers.get("location")).toBe(
      `/api/v1/maintenance/catalogues/${catalogues[0].id}`
    )
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(createCatalogue).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: "collector-id",
        idempotencyKey: "attempt-1",
        requestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        fields: { code: "KM", title: "World Coins" },
      })
    )
  })

  it("returns authoritative pointer-addressed validation", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/catalogues",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: " ", title: "A".repeat(256) }),
      }
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({
      code: "catalogue_validation_failed",
      invalidParams: expect.arrayContaining([
        expect.objectContaining({
          name: "/code",
          code: "catalogue_code_required",
        }),
        expect.objectContaining({
          name: "/title",
          code: "catalogue_title_too_long",
        }),
      ]),
    })
  })

  it("replays identical creates and rejects mismatched key reuse", async () => {
    const replayed = await createApp({
      createCatalogue: async () => ({
        status: "replayed",
        catalogue: catalogues[0],
      }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/catalogues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "KM", title: "World Coins" }),
    })
    expect(replayed.status).toBe(201)

    const mismatch = await createApp({
      createCatalogue: async () => ({ status: "mismatch" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/catalogues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "RIC", title: "Roman" }),
    })
    expect(mismatch.status).toBe(409)
    await expect(mismatch.json()).resolves.toMatchObject({
      code: "idempotency_key_reused",
    })
  })

  it("atomically replaces and deletes with opaque If-Match", async () => {
    const replaceCatalogue = vi.fn(async ({ id, fields }) => ({
      status: "updated" as const,
      catalogue: { ...catalogues[0], id, ...fields, version: 2 },
    }))
    const deleteCatalogue = vi.fn(async () => ({
      status: "deleted" as const,
      catalogue: catalogues[0],
    }))
    const app = createApp({ replaceCatalogue, deleteCatalogue })
    const ifMatch = '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"'
    const replace = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/catalogues/${catalogues[0].id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "If-Match": ifMatch },
        body: JSON.stringify({ code: "RIC", title: "Roman" }),
      }
    )
    expect(replace.status).toBe(200)
    expect(replace.headers.get("etag")).not.toBe(ifMatch)
    expect(replaceCatalogue).toHaveBeenCalledWith({
      id: catalogues[0].id,
      expectedVersion: 1,
      fields: { code: "RIC", title: "Roman" },
    })

    const deleted = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/catalogues/${catalogues[0].id}`,
      { method: "DELETE", headers: { "If-Match": ifMatch } }
    )
    expect(deleted.status).toBe(204)
    expect(await deleted.text()).toBe("")
  })

  it("reports stale writes, Catalogue Code conflicts, and Catalogue Reference conflicts", async () => {
    const stale = await createApp({
      replaceCatalogue: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/catalogues/${catalogues[0].id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
        body: JSON.stringify({ code: "KM", title: "World Coins" }),
      }
    )
    expect(stale.status).toBe(412)
    await expect(stale.json()).resolves.toMatchObject({
      code: "catalogue_precondition_failed",
    })

    const staleDelete = await createApp({
      deleteCatalogue: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/catalogues/${catalogues[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(staleDelete.status).toBe(412)
    await expect(staleDelete.json()).resolves.toMatchObject({
      code: "catalogue_precondition_failed",
    })

    const duplicate = await createApp({
      createCatalogue: async () => {
        throw {
          code: "23505",
          constraint_name: "catalogue_code_lower_unique_idx",
        }
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/catalogues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "KM", title: "World Coins" }),
    })
    expect(duplicate.status).toBe(409)
    await expect(duplicate.json()).resolves.toMatchObject({
      code: "catalogue_code_conflict",
    })

    const inUse = await createApp({
      deleteCatalogue: async () => {
        throw {
          code: "23001",
          constraint_name: "coin_reference_catalogue_id_catalogue_id_fk",
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/catalogues/${catalogues[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(inUse.status).toBe(409)
    await expect(inUse.json()).resolves.toMatchObject({
      code: "catalogue_in_use",
    })
  })

  it("sanitizes unexpected persistence failures", async () => {
    const response = await createApp({
      createCatalogue: async () => {
        throw new Error("postgresql://secret-database")
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/catalogues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "KM", title: "World Coins" }),
    })

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain("secret-database")
  })
})

describe("Catalogue maintenance OpenAPI", () => {
  it("documents every Catalogue operation as Collector-protected", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document: {
      paths: Record<
        string,
        Record<string, { security: unknown; tags: string[] }>
      >
    } = await response.json()
    const collection = document.paths["/api/v1/maintenance/catalogues"]
    const detail = document.paths["/api/v1/maintenance/catalogues/{uuid}"]

    expect(collection.get).toMatchObject({
      tags: ["Catalogue Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(collection.post).toMatchObject({
      tags: ["Catalogue Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(detail.get).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.put).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.delete).toMatchObject({
      security: [{ collectorSession: [] }],
    })
  })
})
