import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"

const mints = [
  {
    id: "018f1a11-aaaa-7000-8000-000000000001",
    code: "madrid",
    name: "Madrid",
    version: 1,
    createdAt: new Date("2026-08-02T10:15:30.000Z"),
    updatedAt: new Date("2026-08-02T10:15:30.000Z"),
  },
  {
    id: "018f1a11-aaaa-7000-8000-000000000002",
    code: "plain",
    name: "Plain",
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
    listMints: async (input) =>
      mints.map((mint) => ({
        ...mint,
        cursorValue: mint[input.sort].toLowerCase(),
        cursorSecondaryValue:
          mint[input.sort === "name" ? "code" : "name"].toLowerCase(),
      })),
    getMint: async (id) => mints.find((mint) => mint.id === id) ?? null,
    createMint: async ({ fields }) => ({
      status: "created" as const,
      mint: {
        ...mints[0],
        id: "018f1a11-aaaa-7000-8000-000000000003",
        ...fields,
      },
    }),
    replaceMint: async ({ id, fields }) => ({
      status: "updated" as const,
      mint: { ...mints[0], id, ...fields, version: 2 },
    }),
    deleteMint: async () => ({
      status: "deleted" as const,
      mint: mints[0],
    }),
    ...overrides,
  })
}

describe("protected Mint maintenance reads", () => {
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
        "https://api.coinarchive.app/api/v1/maintenance/mints"
      )
      expect(response.status).toBe(status)
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      await expect(response.json()).resolves.toMatchObject({ code })
    }

    const adminResponse = await createApp({
      getCollector: async () => ({ id: "admin-id", role: "admin" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/mints")
    expect(adminResponse.status).toBe(200)
  })

  it("returns cursor-paginated Mints and compact options", async () => {
    const listMints = vi.fn(async () =>
      mints.map((mint) => ({
        ...mint,
        cursorValue: mint.name.toLowerCase(),
        cursorSecondaryValue: mint.code.toLowerCase(),
      }))
    )
    const app = createApp({ listMints })
    const list = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/mints?limit=1&q=reeded&sort=name&order=asc"
    )

    expect(list.status).toBe(200)
    expect(list.headers.get("cache-control")).toBe("private, no-store")
    await expect(list.json()).resolves.toStrictEqual({
      data: [
        {
          ...mints[0],
          createdAt: "2026-08-02T10:15:30.000Z",
          updatedAt: "2026-08-02T10:15:30.000Z",
          etag: '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      ],
      nextCursor: expect.any(String),
    })
    expect(listMints).toHaveBeenCalledWith({
      q: "reeded",
      limit: 2,
      sort: "name",
      order: "asc",
    })

    const options = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/mints/options?q=reeded"
    )
    await expect(options.json()).resolves.toStrictEqual({
      data: mints.map(({ id, code, name }) => ({ id, code, name })),
      nextCursor: null,
    })
  })

  it("round-trips Unicode Mint names through opaque cursors", async () => {
    const unicodeMint = { ...mints[0], name: "円形" }
    const listMints = vi
      .fn()
      .mockResolvedValueOnce([
        {
          ...unicodeMint,
          cursorValue: unicodeMint.name,
          cursorSecondaryValue: unicodeMint.code,
        },
        {
          ...mints[1],
          cursorValue: mints[1].name.toLowerCase(),
          cursorSecondaryValue: mints[1].code,
        },
      ])
      .mockResolvedValueOnce([])
    const app = createApp({ listMints })
    const firstResponse = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/mints?limit=1"
    )
    const firstPage = await firstResponse.json<{ nextCursor: string }>()

    expect(firstResponse.status).toBe(200)
    expect(firstPage.nextCursor).toEqual(expect.any(String))

    const secondResponse = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/mints?limit=1&cursor=${firstPage.nextCursor}`
    )

    expect(secondResponse.status).toBe(200)
    expect(listMints).toHaveBeenLastCalledWith({
      cursor: {
        value: unicodeMint.name,
        secondaryValue: unicodeMint.code,
        id: unicodeMint.id,
      },
      limit: 2,
      sort: "name",
      order: "asc",
    })
  })

  it("returns mutable detail with an opaque ETag", async () => {
    const app = createApp()
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/mints/${mints[0].id}`
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    await expect(response.json()).resolves.toMatchObject({
      data: { id: mints[0].id, version: 1 },
    })

    const missing = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/mints/018f1a11-aaaa-7000-8000-000000000099"
    )
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toMatchObject({
      code: "mint_not_found",
    })
  })

  it("rate-limits reads per authenticated Collector", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/mints"
    )

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("60")
    expect(maintenanceRateLimit).toHaveBeenCalledWith("collector-id", "read")
  })
})

describe("protected Mint maintenance mutations", () => {
  it("rate-limits mutations with the Collector mutation budget", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/mints",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "madrid", name: "Madrid" }),
      }
    )

    expect(response.status).toBe(429)
    expect(maintenanceRateLimit).toHaveBeenCalledWith(
      "collector-id",
      "mutation"
    )
  })

  it("creates with normalization, retry identity, and standard success headers", async () => {
    const createMint = vi.fn(async ({ fields }) => ({
      status: "created" as const,
      mint: { ...mints[0], ...fields },
    }))
    const response = await createApp({ createMint }).request(
      "https://api.coinarchive.app/api/v1/maintenance/mints",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: " reeded ", name: " Reeded " }),
      }
    )

    expect(response.status).toBe(201)
    expect(response.headers.get("location")).toBe(
      `/api/v1/maintenance/mints/${mints[0].id}`
    )
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(createMint).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: "collector-id",
        idempotencyKey: "attempt-1",
        requestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        fields: { code: "reeded", name: "Reeded" },
      })
    )
  })

  it("returns authoritative pointer-addressed validation", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/mints",
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
      title: "Mint validation failed",
      code: "mint_validation_failed",
      invalidParams: expect.arrayContaining([
        expect.objectContaining({
          name: "/code",
          code: "mint_code_required",
        }),
        expect.objectContaining({
          name: "/name",
          code: "mint_name_too_long",
        }),
      ]),
    })

    const invalidCode = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/mints",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-2",
        },
        body: JSON.stringify({
          code: "Madrid Mint",
          name: "Madrid",
        }),
      }
    )
    expect(invalidCode.status).toBe(422)
    await expect(invalidCode.json()).resolves.toMatchObject({
      invalidParams: [
        expect.objectContaining({
          name: "/code",
          code: "mint_code_invalid",
        }),
      ],
    })

    const invalidBody = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/mints",
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
          code: "mint_body_invalid",
        }),
      ],
    })
  })

  it("replays identical creates and rejects mismatched key reuse", async () => {
    const replayed = await createApp({
      createMint: async () => ({
        status: "replayed",
        mint: mints[0],
      }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/mints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "madrid", name: "Madrid" }),
    })
    expect(replayed.status).toBe(201)

    const mismatch = await createApp({
      createMint: async () => ({ status: "mismatch" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/mints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "plain", name: "Plain" }),
    })
    expect(mismatch.status).toBe(409)
    await expect(mismatch.json()).resolves.toMatchObject({
      code: "idempotency_key_reused",
    })
  })

  it("atomically replaces and deletes with opaque If-Match", async () => {
    const replaceMint = vi.fn(async ({ id, fields }) => ({
      status: "updated" as const,
      mint: { ...mints[0], id, ...fields, version: 2 },
    }))
    const deleteMint = vi.fn(async () => ({
      status: "deleted" as const,
      mint: mints[0],
    }))
    const app = createApp({ replaceMint, deleteMint })
    const ifMatch = '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"'
    const replace = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/mints/${mints[0].id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "If-Match": ifMatch },
        body: JSON.stringify({ code: "plain", name: "Plain" }),
      }
    )
    expect(replace.status).toBe(200)
    expect(replace.headers.get("etag")).not.toBe(ifMatch)
    expect(replaceMint).toHaveBeenCalledWith({
      id: mints[0].id,
      expectedVersion: 1,
      fields: { code: "plain", name: "Plain" },
    })

    const deleted = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/mints/${mints[0].id}`,
      { method: "DELETE", headers: { "If-Match": ifMatch } }
    )
    expect(deleted.status).toBe(204)
    expect(await deleted.text()).toBe("")
  })

  it("reports stale writes, Mint Code conflicts, and dependent-Coin conflicts", async () => {
    const stale = await createApp({
      replaceMint: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/mints/${mints[0].id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
        body: JSON.stringify({ code: "madrid", name: "Madrid" }),
      }
    )
    expect(stale.status).toBe(412)
    await expect(stale.json()).resolves.toMatchObject({
      code: "mint_precondition_failed",
    })

    const staleDelete = await createApp({
      deleteMint: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/mints/${mints[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(staleDelete.status).toBe(412)
    await expect(staleDelete.json()).resolves.toMatchObject({
      code: "mint_precondition_failed",
    })

    const duplicate = await createApp({
      createMint: async () => {
        throw {
          code: "23505",
          constraint_name: "mint_code_lower_unique_idx",
        }
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/mints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "madrid", name: "Madrid" }),
    })
    expect(duplicate.status).toBe(409)
    await expect(duplicate.json()).resolves.toMatchObject({
      code: "mint_code_conflict",
    })

    const inUse = await createApp({
      deleteMint: async () => {
        throw {
          code: "23001",
          constraint_name: "coin_mint_mint_id_mint_id_fk",
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/mints/${mints[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(inUse.status).toBe(409)
    await expect(inUse.json()).resolves.toMatchObject({
      code: "mint_in_use",
    })
  })

  it("sanitizes unexpected persistence failures", async () => {
    const response = await createApp({
      createMint: async () => {
        throw new Error("postgresql://secret-database")
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/mints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "madrid", name: "Madrid" }),
    })

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain("secret-database")
  })
})

describe("Mint maintenance OpenAPI", () => {
  it("documents every Mint operation as Collector-protected", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document: {
      paths: Record<
        string,
        Record<string, { security: unknown; tags: string[] }>
      >
    } = await response.json()
    const collection = document.paths["/api/v1/maintenance/mints"]
    const detail = document.paths["/api/v1/maintenance/mints/{uuid}"]

    expect(collection.get).toMatchObject({
      tags: ["Mint Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(collection.post).toMatchObject({
      tags: ["Mint Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(detail.get).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.put).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.delete).toMatchObject({
      security: [{ collectorSession: [] }],
    })
    const mintOperations = JSON.stringify({ collection, detail })
    expect(mintOperations).toContain("mint_code_invalid")
    expect(mintOperations).toContain("mint_in_use")
  })
})
