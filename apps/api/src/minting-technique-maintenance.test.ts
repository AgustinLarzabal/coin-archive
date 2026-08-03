import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"

const mintingTechniques = [
  {
    id: "018f1a11-aaaa-7000-8000-000000000001",
    code: "reeded",
    name: "Reeded",
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
    listMintingTechniques: async (input) =>
      mintingTechniques.map((mintingTechnique) => ({
        ...mintingTechnique,
        cursorValue: mintingTechnique[input.sort].toLowerCase(),
        cursorSecondaryValue:
          mintingTechnique[
            input.sort === "name" ? "code" : "name"
          ].toLowerCase(),
      })),
    getMintingTechnique: async (id) =>
      mintingTechniques.find(
        (mintingTechnique) => mintingTechnique.id === id
      ) ?? null,
    createMintingTechnique: async ({ fields }) => ({
      status: "created" as const,
      mintingTechnique: {
        ...mintingTechniques[0],
        id: "018f1a11-aaaa-7000-8000-000000000003",
        ...fields,
      },
    }),
    replaceMintingTechnique: async ({ id, fields }) => ({
      status: "updated" as const,
      mintingTechnique: { ...mintingTechniques[0], id, ...fields, version: 2 },
    }),
    deleteMintingTechnique: async () => ({
      status: "deleted" as const,
      mintingTechnique: mintingTechniques[0],
    }),
    ...overrides,
  })
}

describe("protected Minting Technique maintenance reads", () => {
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
        "https://api.coinarchive.app/api/v1/maintenance/minting-techniques"
      )
      expect(response.status).toBe(status)
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      await expect(response.json()).resolves.toMatchObject({ code })
    }

    const adminResponse = await createApp({
      getCollector: async () => ({ id: "admin-id", role: "admin" }),
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques"
    )
    expect(adminResponse.status).toBe(200)
  })

  it("returns cursor-paginated Minting Techniques and compact options", async () => {
    const listMintingTechniques = vi.fn(async () =>
      mintingTechniques.map((mintingTechnique) => ({
        ...mintingTechnique,
        cursorValue: mintingTechnique.name.toLowerCase(),
        cursorSecondaryValue: mintingTechnique.code.toLowerCase(),
      }))
    )
    const app = createApp({ listMintingTechniques })
    const list = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques?limit=1&q=reeded&sort=name&order=asc"
    )

    expect(list.status).toBe(200)
    expect(list.headers.get("cache-control")).toBe("private, no-store")
    await expect(list.json()).resolves.toStrictEqual({
      data: [
        {
          ...mintingTechniques[0],
          createdAt: "2026-08-02T10:15:30.000Z",
          updatedAt: "2026-08-02T10:15:30.000Z",
          etag: '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      ],
      nextCursor: expect.any(String),
    })
    expect(listMintingTechniques).toHaveBeenCalledWith({
      q: "reeded",
      limit: 2,
      sort: "name",
      order: "asc",
    })

    const options = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques/options?q=reeded"
    )
    await expect(options.json()).resolves.toStrictEqual({
      data: mintingTechniques.map(({ id, code, name }) => ({ id, code, name })),
      nextCursor: null,
    })
  })

  it("round-trips Unicode MintingTechnique names through opaque cursors", async () => {
    const unicodeMintingTechnique = { ...mintingTechniques[0], name: "円形" }
    const listMintingTechniques = vi
      .fn()
      .mockResolvedValueOnce([
        {
          ...unicodeMintingTechnique,
          cursorValue: unicodeMintingTechnique.name,
          cursorSecondaryValue: unicodeMintingTechnique.code,
        },
        {
          ...mintingTechniques[1],
          cursorValue: mintingTechniques[1].name.toLowerCase(),
          cursorSecondaryValue: mintingTechniques[1].code,
        },
      ])
      .mockResolvedValueOnce([])
    const app = createApp({ listMintingTechniques })
    const firstResponse = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques?limit=1"
    )
    const firstPage = await firstResponse.json<{ nextCursor: string }>()

    expect(firstResponse.status).toBe(200)
    expect(firstPage.nextCursor).toEqual(expect.any(String))

    const secondResponse = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/minting-techniques?limit=1&cursor=${firstPage.nextCursor}`
    )

    expect(secondResponse.status).toBe(200)
    expect(listMintingTechniques).toHaveBeenLastCalledWith({
      cursor: {
        value: unicodeMintingTechnique.name,
        secondaryValue: unicodeMintingTechnique.code,
        id: unicodeMintingTechnique.id,
      },
      limit: 2,
      sort: "name",
      order: "asc",
    })
  })

  it("returns mutable detail with an opaque ETag", async () => {
    const app = createApp()
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/minting-techniques/${mintingTechniques[0].id}`
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    await expect(response.json()).resolves.toMatchObject({
      data: { id: mintingTechniques[0].id, version: 1 },
    })

    const missing = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques/018f1a11-aaaa-7000-8000-000000000099"
    )
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toMatchObject({
      code: "minting_technique_not_found",
    })
  })

  it("rate-limits reads per authenticated Collector", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques"
    )

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("60")
    expect(maintenanceRateLimit).toHaveBeenCalledWith("collector-id", "read")
  })
})

describe("protected Minting Technique maintenance mutations", () => {
  it("rate-limits mutations with the Collector mutation budget", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "reeded", name: "Reeded" }),
      }
    )

    expect(response.status).toBe(429)
    expect(maintenanceRateLimit).toHaveBeenCalledWith(
      "collector-id",
      "mutation"
    )
  })

  it("creates with normalization, retry identity, and standard success headers", async () => {
    const createMintingTechnique = vi.fn(async ({ fields }) => ({
      status: "created" as const,
      mintingTechnique: { ...mintingTechniques[0], ...fields },
    }))
    const response = await createApp({ createMintingTechnique }).request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques",
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
      `/api/v1/maintenance/minting-techniques/${mintingTechniques[0].id}`
    )
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(createMintingTechnique).toHaveBeenCalledWith(
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
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques",
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
      title: "Minting Technique validation failed",
      code: "minting_technique_validation_failed",
      invalidParams: expect.arrayContaining([
        expect.objectContaining({
          name: "/code",
          code: "minting_technique_code_required",
        }),
        expect.objectContaining({
          name: "/name",
          code: "minting_technique_name_too_long",
        }),
      ]),
    })

    const invalidCode = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-2",
        },
        body: JSON.stringify({
          code: "Reeded MintingTechnique",
          name: "Reeded",
        }),
      }
    )
    expect(invalidCode.status).toBe(422)
    await expect(invalidCode.json()).resolves.toMatchObject({
      invalidParams: [
        expect.objectContaining({
          name: "/code",
          code: "minting_technique_code_invalid",
        }),
      ],
    })

    const invalidBody = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques",
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
          code: "minting_technique_body_invalid",
        }),
      ],
    })
  })

  it("replays identical creates and rejects mismatched key reuse", async () => {
    const replayed = await createApp({
      createMintingTechnique: async () => ({
        status: "replayed",
        mintingTechnique: mintingTechniques[0],
      }),
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "reeded", name: "Reeded" }),
      }
    )
    expect(replayed.status).toBe(201)

    const mismatch = await createApp({
      createMintingTechnique: async () => ({ status: "mismatch" }),
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "plain", name: "Plain" }),
      }
    )
    expect(mismatch.status).toBe(409)
    await expect(mismatch.json()).resolves.toMatchObject({
      code: "idempotency_key_reused",
    })
  })

  it("atomically replaces and deletes with opaque If-Match", async () => {
    const replaceMintingTechnique = vi.fn(async ({ id, fields }) => ({
      status: "updated" as const,
      mintingTechnique: { ...mintingTechniques[0], id, ...fields, version: 2 },
    }))
    const deleteMintingTechnique = vi.fn(async () => ({
      status: "deleted" as const,
      mintingTechnique: mintingTechniques[0],
    }))
    const app = createApp({ replaceMintingTechnique, deleteMintingTechnique })
    const ifMatch = '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"'
    const replace = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/minting-techniques/${mintingTechniques[0].id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "If-Match": ifMatch },
        body: JSON.stringify({ code: "plain", name: "Plain" }),
      }
    )
    expect(replace.status).toBe(200)
    expect(replace.headers.get("etag")).not.toBe(ifMatch)
    expect(replaceMintingTechnique).toHaveBeenCalledWith({
      id: mintingTechniques[0].id,
      expectedVersion: 1,
      fields: { code: "plain", name: "Plain" },
    })

    const deleted = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/minting-techniques/${mintingTechniques[0].id}`,
      { method: "DELETE", headers: { "If-Match": ifMatch } }
    )
    expect(deleted.status).toBe(204)
    expect(await deleted.text()).toBe("")
  })

  it("reports stale writes, Minting Technique Code conflicts, and dependent-Coin conflicts", async () => {
    const stale = await createApp({
      replaceMintingTechnique: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/minting-techniques/${mintingTechniques[0].id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
        body: JSON.stringify({ code: "reeded", name: "Reeded" }),
      }
    )
    expect(stale.status).toBe(412)
    await expect(stale.json()).resolves.toMatchObject({
      code: "minting_technique_precondition_failed",
    })

    const staleDelete = await createApp({
      deleteMintingTechnique: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/minting-techniques/${mintingTechniques[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(staleDelete.status).toBe(412)
    await expect(staleDelete.json()).resolves.toMatchObject({
      code: "minting_technique_precondition_failed",
    })

    const duplicate = await createApp({
      createMintingTechnique: async () => {
        throw {
          code: "23505",
          constraint_name: "technique_code_lower_unique_idx",
        }
      },
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "reeded", name: "Reeded" }),
      }
    )
    expect(duplicate.status).toBe(409)
    await expect(duplicate.json()).resolves.toMatchObject({
      code: "minting_technique_code_conflict",
    })

    const inUse = await createApp({
      deleteMintingTechnique: async () => {
        throw {
          code: "23001",
          constraint_name: "coin_technique_id_technique_id_fk",
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/minting-techniques/${mintingTechniques[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(inUse.status).toBe(409)
    await expect(inUse.json()).resolves.toMatchObject({
      code: "minting_technique_in_use",
    })
  })

  it("sanitizes unexpected persistence failures", async () => {
    const response = await createApp({
      createMintingTechnique: async () => {
        throw new Error("postgresql://secret-database")
      },
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/minting-techniques",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "reeded", name: "Reeded" }),
      }
    )

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain("secret-database")
  })
})

describe("Minting Technique maintenance OpenAPI", () => {
  it("documents every Minting Technique operation as Collector-protected", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document: {
      paths: Record<
        string,
        Record<string, { security: unknown; tags: string[] }>
      >
    } = await response.json()
    const collection = document.paths["/api/v1/maintenance/minting-techniques"]
    const detail =
      document.paths["/api/v1/maintenance/minting-techniques/{uuid}"]

    expect(collection.get).toMatchObject({
      tags: ["Minting Technique Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(collection.post).toMatchObject({
      tags: ["Minting Technique Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(detail.get).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.put).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.delete).toMatchObject({
      security: [{ collectorSession: [] }],
    })
    const mintingTechniqueOperations = JSON.stringify({ collection, detail })
    expect(mintingTechniqueOperations).toContain(
      "minting_technique_code_invalid"
    )
    expect(mintingTechniqueOperations).toContain("minting_technique_in_use")
  })
})
