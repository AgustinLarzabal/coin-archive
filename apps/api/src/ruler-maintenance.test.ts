import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"

const rulers = [
  {
    id: "018f1a11-aaaa-7000-8000-000000000001",
    code: "house-of-bourbon",
    name: "House of Bourbon",
    group: {
      id: "018f1a11-aaaa-7000-8000-000000000010",
      code: "house-of-bourbon",
      name: "House of Bourbon",
    },
    version: 1,
    createdAt: new Date("2026-08-02T10:15:30.000Z"),
    updatedAt: new Date("2026-08-02T10:15:30.000Z"),
  },
  {
    id: "018f1a11-aaaa-7000-8000-000000000002",
    code: "julio-claudians",
    name: "Julio-Claudians",
    group: null,
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
    listRulers: async (input) =>
      rulers.map((ruler) => ({
        ...ruler,
        cursorValue: ruler[input.sort].toLowerCase(),
        cursorSecondaryValue:
          ruler[input.sort === "name" ? "code" : "name"].toLowerCase(),
      })),
    getRuler: async (id) => rulers.find((ruler) => ruler.id === id) ?? null,
    createRuler: async ({ fields }) => ({
      status: "created" as const,
      ruler: {
        ...rulers[0],
        id: "018f1a11-aaaa-7000-8000-000000000003",
        ...fields,
      },
    }),
    replaceRuler: async ({ id, fields }) => ({
      status: "updated" as const,
      ruler: { ...rulers[0], id, ...fields, version: 2 },
    }),
    deleteRuler: async () => ({
      status: "deleted" as const,
      ruler: rulers[0],
    }),
    ...overrides,
  })
}

describe("protected Ruler maintenance reads", () => {
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
        "https://api.coinarchive.app/api/v1/maintenance/rulers"
      )
      expect(response.status).toBe(status)
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      await expect(response.json()).resolves.toMatchObject({ code })
    }

    const adminResponse = await createApp({
      getCollector: async () => ({ id: "admin-id", role: "admin" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/rulers")
    expect(adminResponse.status).toBe(200)
  })

  it("returns cursor-paginated Rulers and compact options", async () => {
    const listRulers = vi.fn(async () =>
      rulers.map((ruler) => ({
        ...ruler,
        cursorValue: ruler.name.toLowerCase(),
        cursorSecondaryValue: ruler.code.toLowerCase(),
      }))
    )
    const app = createApp({ listRulers })
    const list = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/rulers?limit=1&q=house-of-bourbon&sort=name&order=asc"
    )

    expect(list.status).toBe(200)
    expect(list.headers.get("cache-control")).toBe("private, no-store")
    await expect(list.json()).resolves.toStrictEqual({
      data: [
        {
          ...rulers[0],
          createdAt: "2026-08-02T10:15:30.000Z",
          updatedAt: "2026-08-02T10:15:30.000Z",
          etag: '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      ],
      nextCursor: expect.any(String),
    })
    expect(listRulers).toHaveBeenCalledWith({
      q: "house-of-bourbon",
      limit: 2,
      sort: "name",
      order: "asc",
    })

    const options = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/rulers/options?q=house-of-bourbon"
    )
    await expect(options.json()).resolves.toStrictEqual({
      data: rulers.map(({ id, code, name, group }) => ({
        id,
        code,
        name,
        group,
      })),
      nextCursor: null,
    })
  })

  it("round-trips Unicode Ruler names through opaque cursors", async () => {
    const unicodeRuler = { ...rulers[0], name: "円形" }
    const listRulers = vi
      .fn()
      .mockResolvedValueOnce([
        {
          ...unicodeRuler,
          cursorValue: unicodeRuler.name,
          cursorSecondaryValue: unicodeRuler.code,
        },
        {
          ...rulers[1],
          cursorValue: rulers[1].name.toLowerCase(),
          cursorSecondaryValue: rulers[1].code,
        },
      ])
      .mockResolvedValueOnce([])
    const app = createApp({ listRulers })
    const firstResponse = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/rulers?limit=1"
    )
    const firstPage = await firstResponse.json<{ nextCursor: string }>()

    expect(firstResponse.status).toBe(200)
    expect(firstPage.nextCursor).toEqual(expect.any(String))

    const secondResponse = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/rulers?limit=1&cursor=${firstPage.nextCursor}`
    )

    expect(secondResponse.status).toBe(200)
    expect(listRulers).toHaveBeenLastCalledWith({
      cursor: {
        value: unicodeRuler.name,
        secondaryValue: unicodeRuler.code,
        id: unicodeRuler.id,
      },
      limit: 2,
      sort: "name",
      order: "asc",
    })
  })

  it("returns mutable detail with an opaque ETag", async () => {
    const app = createApp()
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/rulers/${rulers[0].id}`
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    await expect(response.json()).resolves.toMatchObject({
      data: { id: rulers[0].id, version: 1 },
    })

    const missing = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/rulers/018f1a11-aaaa-7000-8000-000000000099"
    )
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toMatchObject({
      code: "ruler_not_found",
    })
  })

  it("rate-limits reads per authenticated Collector", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/rulers"
    )

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("60")
    expect(maintenanceRateLimit).toHaveBeenCalledWith("collector-id", "read")
  })
})

describe("protected Ruler maintenance mutations", () => {
  it("rate-limits mutations with the Collector mutation budget", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/rulers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({
          code: "house-of-bourbon",
          name: "House of Bourbon",
        }),
      }
    )

    expect(response.status).toBe(429)
    expect(maintenanceRateLimit).toHaveBeenCalledWith(
      "collector-id",
      "mutation"
    )
  })

  it("creates with normalization, retry identity, and standard success headers", async () => {
    const createRuler = vi.fn(async ({ fields }) => ({
      status: "created" as const,
      ruler: { ...rulers[0], ...fields },
    }))
    const response = await createApp({ createRuler }).request(
      "https://api.coinarchive.app/api/v1/maintenance/rulers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({
          code: " house-of-bourbon ",
          name: " House of Bourbon ",
          rulerGroupId: null,
        }),
      }
    )

    expect(response.status).toBe(201)
    expect(response.headers.get("location")).toBe(
      `/api/v1/maintenance/rulers/${rulers[0].id}`
    )
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(createRuler).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: "collector-id",
        idempotencyKey: "attempt-1",
        requestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        fields: {
          code: "house-of-bourbon",
          name: "House of Bourbon",
          rulerGroupId: null,
        },
      })
    )
  })

  it("returns authoritative pointer-addressed validation", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/rulers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({
          code: " ",
          name: "A".repeat(256),
          rulerGroupId: null,
        }),
      }
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({
      title: "Ruler validation failed",
      code: "ruler_validation_failed",
      invalidParams: expect.arrayContaining([
        expect.objectContaining({
          name: "/code",
          code: "ruler_code_required",
        }),
        expect.objectContaining({
          name: "/name",
          code: "ruler_name_too_long",
        }),
      ]),
    })

    const invalidCode = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/rulers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-2",
        },
        body: JSON.stringify({
          code: "Invalid Ruler Code",
          name: "House of Bourbon",
          rulerGroupId: null,
        }),
      }
    )
    expect(invalidCode.status).toBe(422)
    await expect(invalidCode.json()).resolves.toMatchObject({
      invalidParams: expect.arrayContaining([
        expect.objectContaining({
          name: "/code",
          code: "ruler_code_invalid",
        }),
      ]),
    })

    const invalidBody = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/rulers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-3",
        },
        body: "null",
      }
    )
    expect(invalidBody.status).toBe(422)
    await expect(invalidBody.json()).resolves.toMatchObject({
      invalidParams: [
        expect.objectContaining({
          name: "/",
          code: "ruler_body_invalid",
        }),
      ],
    })
  })

  it("replays identical creates and rejects mismatched key reuse", async () => {
    const replayed = await createApp({
      createRuler: async () => ({
        status: "replayed",
        ruler: rulers[0],
      }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/rulers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({
        code: "house-of-bourbon",
        name: "House of Bourbon",
        rulerGroupId: null,
      }),
    })
    expect(replayed.status).toBe(201)

    const mismatch = await createApp({
      createRuler: async () => ({ status: "mismatch" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/rulers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({
        code: "julio-claudians",
        name: "Julio-Claudians",
        rulerGroupId: null,
      }),
    })
    expect(mismatch.status).toBe(409)
    await expect(mismatch.json()).resolves.toMatchObject({
      code: "idempotency_key_reused",
    })
  })

  it("atomically replaces and deletes with opaque If-Match", async () => {
    const replaceRuler = vi.fn(async ({ id, fields }) => ({
      status: "updated" as const,
      ruler: { ...rulers[0], id, ...fields, version: 2 },
    }))
    const deleteRuler = vi.fn(async () => ({
      status: "deleted" as const,
      ruler: rulers[0],
    }))
    const app = createApp({ replaceRuler, deleteRuler })
    const ifMatch = '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"'
    const replace = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/rulers/${rulers[0].id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "If-Match": ifMatch },
        body: JSON.stringify({
          code: "julio-claudians",
          name: "Julio-Claudians",
          rulerGroupId: null,
        }),
      }
    )
    expect(replace.status).toBe(200)
    expect(replace.headers.get("etag")).not.toBe(ifMatch)
    expect(replaceRuler).toHaveBeenCalledWith({
      id: rulers[0].id,
      expectedVersion: 1,
      fields: {
        code: "julio-claudians",
        name: "Julio-Claudians",
        rulerGroupId: null,
      },
    })

    const deleted = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/rulers/${rulers[0].id}`,
      { method: "DELETE", headers: { "If-Match": ifMatch } }
    )
    expect(deleted.status).toBe(204)
    expect(await deleted.text()).toBe("")
  })

  it("reports stale writes, Ruler Code conflicts, and dependent-Ruler conflicts", async () => {
    const stale = await createApp({
      replaceRuler: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/rulers/${rulers[0].id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
        body: JSON.stringify({
          code: "house-of-bourbon",
          name: "House of Bourbon",
          rulerGroupId: null,
        }),
      }
    )
    expect(stale.status).toBe(412)
    await expect(stale.json()).resolves.toMatchObject({
      code: "ruler_precondition_failed",
    })

    const staleDelete = await createApp({
      deleteRuler: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/rulers/${rulers[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(staleDelete.status).toBe(412)
    await expect(staleDelete.json()).resolves.toMatchObject({
      code: "ruler_precondition_failed",
    })

    const duplicate = await createApp({
      createRuler: async () => {
        throw {
          code: "23505",
          constraint_name: "ruler_code_unique_idx",
        }
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/rulers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({
        code: "house-of-bourbon",
        name: "House of Bourbon",
        rulerGroupId: null,
      }),
    })
    expect(duplicate.status).toBe(409)
    await expect(duplicate.json()).resolves.toMatchObject({
      code: "ruler_code_conflict",
    })

    const inUse = await createApp({
      deleteRuler: async () => {
        throw {
          code: "23001",
          constraint_name: "coin_ruler_ruler_id_ruler_id_fk",
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/rulers/${rulers[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(inUse.status).toBe(409)
    await expect(inUse.json()).resolves.toMatchObject({
      code: "ruler_in_use",
    })

    const missingGroup = await createApp({
      createRuler: async () => {
        throw {
          code: "23503",
          constraint_name: "ruler_ruler_group_id_ruler_group_id_fk",
        }
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/rulers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-missing-group",
      },
      body: JSON.stringify({
        code: "felipe-v",
        name: "Felipe V",
        rulerGroupId: "018f1a11-aaaa-7000-8000-000000000010",
      }),
    })
    expect(missingGroup.status).toBe(422)
    await expect(missingGroup.json()).resolves.toMatchObject({
      code: "ruler_group_not_found",
      invalidParams: [expect.objectContaining({ name: "/rulerGroupId" })],
    })
  })

  it("sanitizes unexpected persistence failures", async () => {
    const response = await createApp({
      createRuler: async () => {
        throw new Error("postgresql://secret-database")
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/rulers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({
        code: "house-of-bourbon",
        name: "House of Bourbon",
        rulerGroupId: null,
      }),
    })

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain("secret-database")
  })
})

describe("Ruler maintenance OpenAPI", () => {
  it("documents every Ruler operation as Collector-protected", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document: {
      paths: Record<
        string,
        Record<string, { security: unknown; tags: string[] }>
      >
    } = await response.json()
    const collection = document.paths["/api/v1/maintenance/rulers"]
    const detail = document.paths["/api/v1/maintenance/rulers/{uuid}"]

    expect(collection.get).toMatchObject({
      tags: ["Ruler Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(collection.post).toMatchObject({
      tags: ["Ruler Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(detail.get).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.put).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.delete).toMatchObject({
      security: [{ collectorSession: [] }],
    })
    const rulerOperations = JSON.stringify({ collection, detail })
    expect(rulerOperations).toContain("ruler_code_invalid")
    expect(rulerOperations).toContain("ruler_in_use")
  })
})
