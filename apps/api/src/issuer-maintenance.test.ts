import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"

const issuers = [
  {
    id: "018f1a11-aaaa-7000-8000-000000000001",
    code: "reeded",
    isoCode: "AR",
    name: "Reeded",
    parentIssuerId: null,
    version: 1,
    createdAt: new Date("2026-08-02T10:15:30.000Z"),
    updatedAt: new Date("2026-08-02T10:15:30.000Z"),
  },
  {
    id: "018f1a11-aaaa-7000-8000-000000000002",
    code: "plain",
    isoCode: "IT",
    name: "Plain",
    parentIssuerId: null,
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
    listIssuers: async (input) =>
      issuers.map((issuer) => ({
        ...issuer,
        cursorValue: issuer[input.sort].toLowerCase(),
        cursorSecondaryValue:
          issuer[input.sort === "name" ? "code" : "name"].toLowerCase(),
      })),
    getIssuer: async (id) => issuers.find((issuer) => issuer.id === id) ?? null,
    createIssuer: async ({ fields }) => ({
      status: "created" as const,
      issuer: {
        ...issuers[0],
        id: "018f1a11-aaaa-7000-8000-000000000003",
        ...fields,
      },
    }),
    replaceIssuer: async ({ id, fields }) => ({
      status: "updated" as const,
      issuer: { ...issuers[0], id, ...fields, version: 2 },
    }),
    deleteIssuer: async () => ({
      status: "deleted" as const,
      issuer: issuers[0],
    }),
    ...overrides,
  })
}

describe("protected Issuer maintenance reads", () => {
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
        "https://api.coinarchive.app/api/v1/maintenance/issuers"
      )

      expect(response.status).toBe(status)
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      await expect(response.json()).resolves.toMatchObject({ code })
    }

    const adminResponse = await createApp({
      getCollector: async () => ({ id: "admin-id", role: "admin" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/issuers")
    expect(adminResponse.status).toBe(200)
  })

  it("returns cursor-paginated Issuers and compact options", async () => {
    const listIssuers = vi.fn(async () =>
      issuers.map((issuer) => ({
        ...issuer,
        cursorValue: issuer.name.toLowerCase(),
        cursorSecondaryValue: issuer.code.toLowerCase(),
      }))
    )
    const app = createApp({ listIssuers })
    const list = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/issuers?limit=1&q=reeded&sort=name&order=asc"
    )

    expect(list.status).toBe(200)
    expect(list.headers.get("cache-control")).toBe("private, no-store")
    await expect(list.json()).resolves.toStrictEqual({
      data: [
        {
          ...issuers[0],
          createdAt: "2026-08-02T10:15:30.000Z",
          updatedAt: "2026-08-02T10:15:30.000Z",
          etag: '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      ],
      nextCursor: expect.any(String),
    })
    expect(listIssuers).toHaveBeenCalledWith({
      q: "reeded",
      limit: 2,
      sort: "name",
      order: "asc",
    })

    const options = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/issuers/options?q=reeded"
    )
    await expect(options.json()).resolves.toStrictEqual({
      data: issuers.map(({ id, code, isoCode, name }) => ({
        id,
        code,
        isoCode,
        name,
      })),
      nextCursor: null,
    })
  })

  it("round-trips Unicode Issuer names through opaque cursors", async () => {
    const unicodeIssuer = { ...issuers[0], name: "円形" }
    const listIssuers = vi
      .fn()
      .mockResolvedValueOnce([
        {
          ...unicodeIssuer,
          cursorValue: unicodeIssuer.name,
          cursorSecondaryValue: unicodeIssuer.code,
        },
        {
          ...issuers[1],
          cursorValue: issuers[1].name.toLowerCase(),
          cursorSecondaryValue: issuers[1].code,
        },
      ])
      .mockResolvedValueOnce([])
    const app = createApp({ listIssuers })
    const firstResponse = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/issuers?limit=1"
    )
    const firstPage = await firstResponse.json<{ nextCursor: string }>()

    expect(firstResponse.status).toBe(200)
    expect(firstPage.nextCursor).toEqual(expect.any(String))

    const secondResponse = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/issuers?limit=1&cursor=${firstPage.nextCursor}`
    )

    expect(secondResponse.status).toBe(200)
    expect(listIssuers).toHaveBeenLastCalledWith({
      cursor: {
        value: unicodeIssuer.name,
        secondaryValue: unicodeIssuer.code,
        id: unicodeIssuer.id,
      },
      limit: 2,
      sort: "name",
      order: "asc",
    })
  })

  it("returns mutable detail with an opaque ETag", async () => {
    const app = createApp()
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/issuers/${issuers[0].id}`
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    await expect(response.json()).resolves.toMatchObject({
      data: { id: issuers[0].id, version: 1 },
    })

    const missing = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/issuers/018f1a11-aaaa-7000-8000-000000000099"
    )
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toMatchObject({
      code: "issuer_not_found",
    })
  })

  it("rate-limits reads per authenticated Collector", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/issuers"
    )

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("60")
    expect(maintenanceRateLimit).toHaveBeenCalledWith("collector-id", "read")
  })
})

describe("protected Issuer maintenance mutations", () => {
  it("rate-limits mutations with the Collector mutation budget", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/issuers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({
          code: "reeded",
          isoCode: "AR",
          name: "Reeded",
          parentIssuerId: null,
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
    const createIssuer = vi.fn(async ({ fields }) => ({
      status: "created" as const,
      issuer: { ...issuers[0], ...fields },
    }))
    const response = await createApp({ createIssuer }).request(
      "https://api.coinarchive.app/api/v1/maintenance/issuers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({
          code: " reeded ",
          isoCode: " ar ",
          name: " Reeded ",
          parentIssuerId: null,
        }),
      }
    )

    expect(response.status).toBe(201)
    expect(response.headers.get("location")).toBe(
      `/api/v1/maintenance/issuers/${issuers[0].id}`
    )
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(createIssuer).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: "collector-id",
        idempotencyKey: "attempt-1",
        requestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        fields: {
          code: "reeded",
          isoCode: "AR",
          name: "Reeded",
          parentIssuerId: null,
        },
      })
    )
  })

  it("returns authoritative pointer-addressed validation", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/issuers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({
          code: " ",
          isoCode: "AR",
          name: "A".repeat(256),
          parentIssuerId: null,
        }),
      }
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({
      title: "Issuer validation failed",
      code: "issuer_validation_failed",
      invalidParams: expect.arrayContaining([
        expect.objectContaining({
          name: "/code",
          code: "issuer_code_required",
        }),
        expect.objectContaining({
          name: "/name",
          code: "issuer_name_too_long",
        }),
      ]),
    })

    const invalidCode = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/issuers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-2",
        },
        body: JSON.stringify({
          code: "Reeded Issuer",
          isoCode: "AR",
          name: "Reeded",
          parentIssuerId: null,
        }),
      }
    )
    expect(invalidCode.status).toBe(422)
    await expect(invalidCode.json()).resolves.toMatchObject({
      invalidParams: [
        expect.objectContaining({
          name: "/code",
          code: "issuer_code_invalid",
        }),
      ],
    })

    const invalidBody = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/issuers",
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
          code: "issuer_body_invalid",
        }),
      ],
    })
  })

  it("replays identical creates and rejects mismatched key reuse", async () => {
    const replayed = await createApp({
      createIssuer: async () => ({
        status: "replayed",
        issuer: issuers[0],
      }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/issuers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({
        code: "reeded",
        isoCode: "AR",
        name: "Reeded",
        parentIssuerId: null,
      }),
    })
    expect(replayed.status).toBe(201)

    const mismatch = await createApp({
      createIssuer: async () => ({ status: "mismatch" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/issuers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({
        code: "plain",
        isoCode: "IT",
        name: "Plain",
        parentIssuerId: null,
      }),
    })
    expect(mismatch.status).toBe(409)
    await expect(mismatch.json()).resolves.toMatchObject({
      code: "idempotency_key_reused",
    })
  })

  it("atomically replaces and deletes with opaque If-Match", async () => {
    const replaceIssuer = vi.fn(async ({ id, fields }) => ({
      status: "updated" as const,
      issuer: { ...issuers[0], id, ...fields, version: 2 },
    }))
    const deleteIssuer = vi.fn(async () => ({
      status: "deleted" as const,
      issuer: issuers[0],
    }))
    const app = createApp({ replaceIssuer, deleteIssuer })
    const ifMatch = '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"'
    const replace = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/issuers/${issuers[0].id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "If-Match": ifMatch },
        body: JSON.stringify({
          code: "plain",
          isoCode: "IT",
          name: "Plain",
          parentIssuerId: null,
        }),
      }
    )
    expect(replace.status).toBe(200)
    expect(replace.headers.get("etag")).not.toBe(ifMatch)
    expect(replaceIssuer).toHaveBeenCalledWith({
      id: issuers[0].id,
      expectedVersion: 1,
      fields: {
        code: "plain",
        isoCode: "IT",
        name: "Plain",
        parentIssuerId: null,
      },
    })

    const deleted = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/issuers/${issuers[0].id}`,
      { method: "DELETE", headers: { "If-Match": ifMatch } }
    )
    expect(deleted.status).toBe(204)
    expect(await deleted.text()).toBe("")
  })

  it("reports stale writes, Issuer Code conflicts, and Issuer Attribution conflicts", async () => {
    const stale = await createApp({
      replaceIssuer: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/issuers/${issuers[0].id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
        body: JSON.stringify({
          code: "reeded",
          isoCode: "AR",
          name: "Reeded",
          parentIssuerId: null,
        }),
      }
    )
    expect(stale.status).toBe(412)
    await expect(stale.json()).resolves.toMatchObject({
      code: "issuer_precondition_failed",
    })

    const staleDelete = await createApp({
      deleteIssuer: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/issuers/${issuers[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(staleDelete.status).toBe(412)
    await expect(staleDelete.json()).resolves.toMatchObject({
      code: "issuer_precondition_failed",
    })

    const duplicate = await createApp({
      createIssuer: async () => {
        throw {
          code: "23505",
          constraint_name: "issuer_code_unique_idx",
        }
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/issuers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({
        code: "reeded",
        isoCode: "AR",
        name: "Reeded",
        parentIssuerId: null,
      }),
    })
    expect(duplicate.status).toBe(409)
    await expect(duplicate.json()).resolves.toMatchObject({
      code: "issuer_code_conflict",
    })

    const inUse = await createApp({
      deleteIssuer: async () => {
        throw {
          code: "23001",
          constraint_name: "coin_issuer_id_issuer_id_fk",
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/issuers/${issuers[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(inUse.status).toBe(409)
    await expect(inUse.json()).resolves.toMatchObject({
      code: "issuer_in_use",
    })
  })

  it("sanitizes unexpected persistence failures", async () => {
    const response = await createApp({
      createIssuer: async () => {
        throw new Error("postgresql://secret-database")
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/issuers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({
        code: "reeded",
        isoCode: "AR",
        name: "Reeded",
        parentIssuerId: null,
      }),
    })

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain("secret-database")
  })

  it("preserves Issuer hierarchy and child-dependency problems", async () => {
    const ifMatch = '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"'
    const replacement = {
      method: "PUT",
      headers: { "Content-Type": "application/json", "If-Match": ifMatch },
      body: JSON.stringify({
        code: "reeded",
        isoCode: "AR",
        name: "Reeded",
        parentIssuerId: issuers[1].id,
      }),
    }
    const missingParent = await createApp({
      replaceIssuer: async () => {
        throw {
          code: "23503",
          constraint_name: "issuer_parent_issuer_id_issuer_id_fk",
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/issuers/${issuers[0].id}`,
      replacement
    )
    expect(missingParent.status).toBe(422)
    await expect(missingParent.json()).resolves.toMatchObject({
      code: "issuer_parent_not_found",
      invalidParams: [{ name: "/parentIssuerId" }],
    })

    const cycle = await createApp({
      replaceIssuer: async () => {
        throw {
          code: "23514",
          constraint_name: "issuer_parent_issuer_id_cycle_check",
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/issuers/${issuers[0].id}`,
      replacement
    )
    expect(cycle.status).toBe(422)
    await expect(cycle.json()).resolves.toMatchObject({
      code: "issuer_parent_cycle",
      invalidParams: [{ name: "/parentIssuerId" }],
    })

    const hasChildren = await createApp({
      deleteIssuer: async () => {
        throw {
          code: "23001",
          constraint_name: "issuer_parent_issuer_id_issuer_id_fk",
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/issuers/${issuers[0].id}`,
      { method: "DELETE", headers: { "If-Match": ifMatch } }
    )
    expect(hasChildren.status).toBe(409)
    await expect(hasChildren.json()).resolves.toMatchObject({
      code: "issuer_has_children",
    })
  })
})

describe("Issuer maintenance OpenAPI", () => {
  it("documents every Issuer operation as Collector-protected", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document: {
      paths: Record<
        string,
        Record<string, { security: unknown; tags: string[] }>
      >
    } = await response.json()
    const collection = document.paths["/api/v1/maintenance/issuers"]
    const detail = document.paths["/api/v1/maintenance/issuers/{uuid}"]

    expect(collection.get).toMatchObject({
      tags: ["Issuer Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(collection.post).toMatchObject({
      tags: ["Issuer Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(detail.get).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.put).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.delete).toMatchObject({
      security: [{ collectorSession: [] }],
    })
    const issuerOperations = JSON.stringify({ collection, detail })
    expect(issuerOperations).toContain("issuer_code_invalid")
    expect(issuerOperations).toContain("issuer_in_use")
    expect(issuerOperations).toContain("issuer_not_found")
    expect(issuerOperations).toContain("invalid_issuer_uuid")
  })
})
