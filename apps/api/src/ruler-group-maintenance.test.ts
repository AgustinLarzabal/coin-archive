import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"

const rulerGroups = [
  {
    id: "018f1a11-aaaa-7000-8000-000000000001",
    code: "house-of-bourbon",
    name: "House of Bourbon",
    version: 1,
    createdAt: new Date("2026-08-02T10:15:30.000Z"),
    updatedAt: new Date("2026-08-02T10:15:30.000Z"),
  },
  {
    id: "018f1a11-aaaa-7000-8000-000000000002",
    code: "julio-claudians",
    name: "Julio-Claudians",
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
    listRulerGroups: async (input) =>
      rulerGroups.map((rulerGroup) => ({
        ...rulerGroup,
        cursorValue: rulerGroup[input.sort].toLowerCase(),
        cursorSecondaryValue:
          rulerGroup[
            input.sort === "name" ? "code" : "name"
          ].toLowerCase(),
      })),
    getRulerGroup: async (id) =>
      rulerGroups.find(
        (rulerGroup) => rulerGroup.id === id
      ) ?? null,
    createRulerGroup: async ({ fields }) => ({
      status: "created" as const,
      rulerGroup: {
        ...rulerGroups[0],
        id: "018f1a11-aaaa-7000-8000-000000000003",
        ...fields,
      },
    }),
    replaceRulerGroup: async ({ id, fields }) => ({
      status: "updated" as const,
      rulerGroup: { ...rulerGroups[0], id, ...fields, version: 2 },
    }),
    deleteRulerGroup: async () => ({
      status: "deleted" as const,
      rulerGroup: rulerGroups[0],
    }),
    ...overrides,
  })
}

describe("protected Ruler Group maintenance reads", () => {
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
        "https://api.coinarchive.app/api/v1/maintenance/ruler-groups"
      )
      expect(response.status).toBe(status)
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      await expect(response.json()).resolves.toMatchObject({ code })
    }

    const adminResponse = await createApp({
      getCollector: async () => ({ id: "admin-id", role: "admin" }),
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups"
    )
    expect(adminResponse.status).toBe(200)
  })

  it("returns cursor-paginated Ruler Groups and compact options", async () => {
    const listRulerGroups = vi.fn(async () =>
      rulerGroups.map((rulerGroup) => ({
        ...rulerGroup,
        cursorValue: rulerGroup.name.toLowerCase(),
        cursorSecondaryValue: rulerGroup.code.toLowerCase(),
      }))
    )
    const app = createApp({ listRulerGroups })
    const list = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups?limit=1&q=house-of-bourbon&sort=name&order=asc"
    )

    expect(list.status).toBe(200)
    expect(list.headers.get("cache-control")).toBe("private, no-store")
    await expect(list.json()).resolves.toStrictEqual({
      data: [
        {
          ...rulerGroups[0],
          createdAt: "2026-08-02T10:15:30.000Z",
          updatedAt: "2026-08-02T10:15:30.000Z",
          etag: '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      ],
      nextCursor: expect.any(String),
    })
    expect(listRulerGroups).toHaveBeenCalledWith({
      q: "house-of-bourbon",
      limit: 2,
      sort: "name",
      order: "asc",
    })

    const options = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups/options?q=house-of-bourbon"
    )
    await expect(options.json()).resolves.toStrictEqual({
      data: rulerGroups.map(({ id, code, name }) => ({ id, code, name })),
      nextCursor: null,
    })
  })

  it("round-trips Unicode Ruler Group names through opaque cursors", async () => {
    const unicodeRulerGroup = { ...rulerGroups[0], name: "円形" }
    const listRulerGroups = vi
      .fn()
      .mockResolvedValueOnce([
        {
          ...unicodeRulerGroup,
          cursorValue: unicodeRulerGroup.name,
          cursorSecondaryValue: unicodeRulerGroup.code,
        },
        {
          ...rulerGroups[1],
          cursorValue: rulerGroups[1].name.toLowerCase(),
          cursorSecondaryValue: rulerGroups[1].code,
        },
      ])
      .mockResolvedValueOnce([])
    const app = createApp({ listRulerGroups })
    const firstResponse = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups?limit=1"
    )
    const firstPage = await firstResponse.json<{ nextCursor: string }>()

    expect(firstResponse.status).toBe(200)
    expect(firstPage.nextCursor).toEqual(expect.any(String))

    const secondResponse = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/ruler-groups?limit=1&cursor=${firstPage.nextCursor}`
    )

    expect(secondResponse.status).toBe(200)
    expect(listRulerGroups).toHaveBeenLastCalledWith({
      cursor: {
        value: unicodeRulerGroup.name,
        secondaryValue: unicodeRulerGroup.code,
        id: unicodeRulerGroup.id,
      },
      limit: 2,
      sort: "name",
      order: "asc",
    })
  })

  it("returns mutable detail with an opaque ETag", async () => {
    const app = createApp()
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/ruler-groups/${rulerGroups[0].id}`
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    await expect(response.json()).resolves.toMatchObject({
      data: { id: rulerGroups[0].id, version: 1 },
    })

    const missing = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups/018f1a11-aaaa-7000-8000-000000000099"
    )
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toMatchObject({
      code: "ruler_group_not_found",
    })
  })

  it("rate-limits reads per authenticated Collector", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups"
    )

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("60")
    expect(maintenanceRateLimit).toHaveBeenCalledWith("collector-id", "read")
  })
})

describe("protected Ruler Group maintenance mutations", () => {
  it("rate-limits mutations with the Collector mutation budget", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "house-of-bourbon", name: "House of Bourbon" }),
      }
    )

    expect(response.status).toBe(429)
    expect(maintenanceRateLimit).toHaveBeenCalledWith(
      "collector-id",
      "mutation"
    )
  })

  it("creates with normalization, retry identity, and standard success headers", async () => {
    const createRulerGroup = vi.fn(async ({ fields }) => ({
      status: "created" as const,
      rulerGroup: { ...rulerGroups[0], ...fields },
    }))
    const response = await createApp({ createRulerGroup }).request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: " house-of-bourbon ", name: " House of Bourbon " }),
      }
    )

    expect(response.status).toBe(201)
    expect(response.headers.get("location")).toBe(
      `/api/v1/maintenance/ruler-groups/${rulerGroups[0].id}`
    )
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(createRulerGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: "collector-id",
        idempotencyKey: "attempt-1",
        requestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        fields: { code: "house-of-bourbon", name: "House of Bourbon" },
      })
    )
  })

  it("returns authoritative pointer-addressed validation", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups",
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
      title: "Ruler Group validation failed",
      code: "ruler_group_validation_failed",
      invalidParams: expect.arrayContaining([
        expect.objectContaining({
          name: "/code",
          code: "ruler_group_code_required",
        }),
        expect.objectContaining({
          name: "/name",
          code: "ruler_group_name_too_long",
        }),
      ]),
    })

    const invalidCode = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-2",
        },
        body: JSON.stringify({
          code: "Invalid Ruler Group Code",
          name: "House of Bourbon",
        }),
      }
    )
    expect(invalidCode.status).toBe(422)
    await expect(invalidCode.json()).resolves.toMatchObject({
      invalidParams: [
        expect.objectContaining({
          name: "/code",
          code: "ruler_group_code_invalid",
        }),
      ],
    })

    const invalidBody = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups",
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
          code: "ruler_group_body_invalid",
        }),
      ],
    })
  })

  it("replays identical creates and rejects mismatched key reuse", async () => {
    const replayed = await createApp({
      createRulerGroup: async () => ({
        status: "replayed",
        rulerGroup: rulerGroups[0],
      }),
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "house-of-bourbon", name: "House of Bourbon" }),
      }
    )
    expect(replayed.status).toBe(201)

    const mismatch = await createApp({
      createRulerGroup: async () => ({ status: "mismatch" }),
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "julio-claudians", name: "Julio-Claudians" }),
      }
    )
    expect(mismatch.status).toBe(409)
    await expect(mismatch.json()).resolves.toMatchObject({
      code: "idempotency_key_reused",
    })
  })

  it("atomically replaces and deletes with opaque If-Match", async () => {
    const replaceRulerGroup = vi.fn(async ({ id, fields }) => ({
      status: "updated" as const,
      rulerGroup: { ...rulerGroups[0], id, ...fields, version: 2 },
    }))
    const deleteRulerGroup = vi.fn(async () => ({
      status: "deleted" as const,
      rulerGroup: rulerGroups[0],
    }))
    const app = createApp({ replaceRulerGroup, deleteRulerGroup })
    const ifMatch = '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"'
    const replace = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/ruler-groups/${rulerGroups[0].id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "If-Match": ifMatch },
        body: JSON.stringify({ code: "julio-claudians", name: "Julio-Claudians" }),
      }
    )
    expect(replace.status).toBe(200)
    expect(replace.headers.get("etag")).not.toBe(ifMatch)
    expect(replaceRulerGroup).toHaveBeenCalledWith({
      id: rulerGroups[0].id,
      expectedVersion: 1,
      fields: { code: "julio-claudians", name: "Julio-Claudians" },
    })

    const deleted = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/ruler-groups/${rulerGroups[0].id}`,
      { method: "DELETE", headers: { "If-Match": ifMatch } }
    )
    expect(deleted.status).toBe(204)
    expect(await deleted.text()).toBe("")
  })

  it("reports stale writes, Ruler Group Code conflicts, and dependent-Ruler conflicts", async () => {
    const stale = await createApp({
      replaceRulerGroup: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/ruler-groups/${rulerGroups[0].id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
        body: JSON.stringify({ code: "house-of-bourbon", name: "House of Bourbon" }),
      }
    )
    expect(stale.status).toBe(412)
    await expect(stale.json()).resolves.toMatchObject({
      code: "ruler_group_precondition_failed",
    })

    const staleDelete = await createApp({
      deleteRulerGroup: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/ruler-groups/${rulerGroups[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(staleDelete.status).toBe(412)
    await expect(staleDelete.json()).resolves.toMatchObject({
      code: "ruler_group_precondition_failed",
    })

    const duplicate = await createApp({
      createRulerGroup: async () => {
        throw {
          code: "23505",
          constraint_name: "ruler_group_code_unique_idx",
        }
      },
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "house-of-bourbon", name: "House of Bourbon" }),
      }
    )
    expect(duplicate.status).toBe(409)
    await expect(duplicate.json()).resolves.toMatchObject({
      code: "ruler_group_code_conflict",
    })

    const inUse = await createApp({
      deleteRulerGroup: async () => {
        throw {
          code: "23001",
          constraint_name: "ruler_ruler_group_id_ruler_group_id_fk",
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/ruler-groups/${rulerGroups[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(inUse.status).toBe(409)
    await expect(inUse.json()).resolves.toMatchObject({
      code: "ruler_group_in_use",
    })
  })

  it("sanitizes unexpected persistence failures", async () => {
    const response = await createApp({
      createRulerGroup: async () => {
        throw new Error("postgresql://secret-database")
      },
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/ruler-groups",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "house-of-bourbon", name: "House of Bourbon" }),
      }
    )

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain("secret-database")
  })
})

describe("Ruler Group maintenance OpenAPI", () => {
  it("documents every Ruler Group operation as Collector-protected", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document: {
      paths: Record<
        string,
        Record<string, { security: unknown; tags: string[] }>
      >
    } = await response.json()
    const collection = document.paths["/api/v1/maintenance/ruler-groups"]
    const detail =
      document.paths["/api/v1/maintenance/ruler-groups/{uuid}"]

    expect(collection.get).toMatchObject({
      tags: ["Ruler Group Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(collection.post).toMatchObject({
      tags: ["Ruler Group Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(detail.get).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.put).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.delete).toMatchObject({
      security: [{ collectorSession: [] }],
    })
    const rulerGroupOperations = JSON.stringify({ collection, detail })
    expect(rulerGroupOperations).toContain(
      "ruler_group_code_invalid"
    )
    expect(rulerGroupOperations).toContain("ruler_group_in_use")
  })
})
