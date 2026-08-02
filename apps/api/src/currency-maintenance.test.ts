import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"

const currencies = [
  {
    id: "018f1a11-aaaa-7000-8000-000000000001",
    code: "united-states-dollar",
    name: "Dollar",
    fullName: "United States dollar",
    version: 1,
    createdAt: new Date("2026-08-02T10:15:30.000Z"),
    updatedAt: new Date("2026-08-02T10:15:30.000Z"),
  },
  {
    id: "018f1a11-aaaa-7000-8000-000000000002",
    code: "euro",
    name: "Euro",
    fullName: "Euro",
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
    listCurrencies: async (input) =>
      currencies.map((currency) => ({
        ...currency,
        cursorValue: currency[input.sort].toLowerCase(),
        cursorSecondaryValue:
          currency[input.sort === "name" ? "code" : "name"].toLowerCase(),
      })),
    getCurrency: async (id) =>
      currencies.find((currency) => currency.id === id) ?? null,
    createCurrency: async ({ fields }) => ({
      status: "created" as const,
      currency: {
        ...currencies[0],
        id: "018f1a11-aaaa-7000-8000-000000000003",
        ...fields,
      },
    }),
    replaceCurrency: async ({ id, fields }) => ({
      status: "updated" as const,
      currency: { ...currencies[0], id, ...fields, version: 2 },
    }),
    deleteCurrency: async () => ({
      status: "deleted" as const,
      currency: currencies[0],
    }),
    ...overrides,
  })
}

describe("protected Currency maintenance reads", () => {
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
        "https://api.coinarchive.app/api/v1/maintenance/currencies"
      )

      expect(response.status).toBe(status)
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      await expect(response.json()).resolves.toMatchObject({ code })
    }

    const adminResponse = await createApp({
      getCollector: async () => ({ id: "admin-id", role: "admin" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/currencies")
    expect(adminResponse.status).toBe(200)
  })

  it("returns cursor-paginated Currencies and compact options", async () => {
    const listCurrencies = vi.fn(async () =>
      currencies.map((currency) => ({
        ...currency,
        cursorValue: currency.name.toLowerCase(),
        cursorSecondaryValue: currency.code.toLowerCase(),
      }))
    )
    const app = createApp({ listCurrencies })
    const list = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/currencies?limit=1&q=silver&sort=name&order=asc"
    )

    expect(list.status).toBe(200)
    expect(list.headers.get("cache-control")).toBe("private, no-store")
    await expect(list.json()).resolves.toStrictEqual({
      data: [
        {
          ...currencies[0],
          createdAt: "2026-08-02T10:15:30.000Z",
          updatedAt: "2026-08-02T10:15:30.000Z",
          etag: '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      ],
      nextCursor: expect.any(String),
    })
    expect(listCurrencies).toHaveBeenCalledWith({
      q: "silver",
      limit: 2,
      sort: "name",
      order: "asc",
    })

    const options = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/currencies/options?q=silver"
    )
    await expect(options.json()).resolves.toStrictEqual({
      data: currencies.map(({ id, code, name, fullName }) => ({
        id,
        code,
        name,
        fullName,
      })),
      nextCursor: null,
    })
  })

  it("returns mutable detail with an opaque ETag", async () => {
    const app = createApp()
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/currencies/${currencies[0].id}`
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    await expect(response.json()).resolves.toMatchObject({
      data: { id: currencies[0].id, version: 1 },
    })

    const missing = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/currencies/018f1a11-aaaa-7000-8000-000000000099"
    )
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toMatchObject({
      code: "currency_not_found",
    })
  })

  it("rate-limits reads per authenticated Collector", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/currencies"
    )

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("60")
    expect(maintenanceRateLimit).toHaveBeenCalledWith("collector-id", "read")
  })
})

describe("protected Currency maintenance mutations", () => {
  it("rate-limits mutations with the Collector mutation budget", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const response = await createApp({ maintenanceRateLimit }).request(
      "https://api.coinarchive.app/api/v1/maintenance/currencies",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({
          code: "united-states-dollar",
          name: "Dollar",
          fullName: "United States dollar",
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
    const createCurrency = vi.fn(async ({ fields }) => ({
      status: "created" as const,
      currency: { ...currencies[0], ...fields },
    }))
    const response = await createApp({ createCurrency }).request(
      "https://api.coinarchive.app/api/v1/maintenance/currencies",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({
          code: " united-states-dollar ",
          name: " Dollar ",
          fullName: " United States dollar ",
        }),
      }
    )

    expect(response.status).toBe(201)
    expect(response.headers.get("location")).toBe(
      `/api/v1/maintenance/currencies/${currencies[0].id}`
    )
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(createCurrency).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: "collector-id",
        idempotencyKey: "attempt-1",
        requestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        fields: {
          code: "united-states-dollar",
          name: "Dollar",
          fullName: "United States dollar",
        },
      })
    )
  })

  it("returns authoritative pointer-addressed validation", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/currencies",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({
          code: " ",
          name: "A".repeat(256),
          fullName: "A".repeat(256),
        }),
      }
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({
      title: "Currency validation failed",
      code: "currency_validation_failed",
      invalidParams: expect.arrayContaining([
        expect.objectContaining({
          name: "/code",
          code: "currency_code_required",
        }),
        expect.objectContaining({
          name: "/name",
          code: "currency_name_too_long",
        }),
        expect.objectContaining({
          name: "/fullName",
          code: "currency_full_name_too_long",
        }),
      ]),
    })

    const invalidCode = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/currencies",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-2",
        },
        body: JSON.stringify({
          code: "United States Dollar",
          name: "Dollar",
          fullName: "United States dollar",
        }),
      }
    )
    expect(invalidCode.status).toBe(422)
    await expect(invalidCode.json()).resolves.toMatchObject({
      invalidParams: [
        expect.objectContaining({
          name: "/code",
          code: "currency_code_invalid",
        }),
      ],
    })
  })

  it("replays identical creates and rejects mismatched key reuse", async () => {
    const replayed = await createApp({
      createCurrency: async () => ({
        status: "replayed",
        currency: currencies[0],
      }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/currencies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({
        code: "united-states-dollar",
        name: "Dollar",
        fullName: "United States dollar",
      }),
    })
    expect(replayed.status).toBe(201)

    const mismatch = await createApp({
      createCurrency: async () => ({ status: "mismatch" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/currencies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "euro", name: "Euro", fullName: "Euro" }),
    })
    expect(mismatch.status).toBe(409)
    await expect(mismatch.json()).resolves.toMatchObject({
      code: "idempotency_key_reused",
    })
  })

  it("atomically replaces and deletes with opaque If-Match", async () => {
    const replaceCurrency = vi.fn(async ({ id, fields }) => ({
      status: "updated" as const,
      currency: { ...currencies[0], id, ...fields, version: 2 },
    }))
    const deleteCurrency = vi.fn(async () => ({
      status: "deleted" as const,
      currency: currencies[0],
    }))
    const app = createApp({ replaceCurrency, deleteCurrency })
    const ifMatch = '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"'
    const replace = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/currencies/${currencies[0].id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "If-Match": ifMatch },
        body: JSON.stringify({ code: "euro", name: "Euro", fullName: "Euro" }),
      }
    )
    expect(replace.status).toBe(200)
    expect(replace.headers.get("etag")).not.toBe(ifMatch)
    expect(replaceCurrency).toHaveBeenCalledWith({
      id: currencies[0].id,
      expectedVersion: 1,
      fields: { code: "euro", name: "Euro", fullName: "Euro" },
    })

    const deleted = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/currencies/${currencies[0].id}`,
      { method: "DELETE", headers: { "If-Match": ifMatch } }
    )
    expect(deleted.status).toBe(204)
    expect(await deleted.text()).toBe("")
  })

  it("reports stale writes, Currency Code conflicts, and dependent-Coin conflicts", async () => {
    const stale = await createApp({
      replaceCurrency: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/currencies/${currencies[0].id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
        body: JSON.stringify({
          code: "united-states-dollar",
          name: "Dollar",
          fullName: "United States dollar",
        }),
      }
    )
    expect(stale.status).toBe(412)
    await expect(stale.json()).resolves.toMatchObject({
      code: "currency_precondition_failed",
    })

    const staleDelete = await createApp({
      deleteCurrency: async () => ({ status: "stale" }),
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/currencies/${currencies[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(staleDelete.status).toBe(412)
    await expect(staleDelete.json()).resolves.toMatchObject({
      code: "currency_precondition_failed",
    })

    const duplicate = await createApp({
      createCurrency: async () => {
        throw {
          code: "23505",
          constraint_name: "currency_code_lower_unique_idx",
        }
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/currencies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({
        code: "united-states-dollar",
        name: "Dollar",
        fullName: "United States dollar",
      }),
    })
    expect(duplicate.status).toBe(409)
    await expect(duplicate.json()).resolves.toMatchObject({
      code: "currency_code_conflict",
    })

    const inUse = await createApp({
      deleteCurrency: async () => {
        throw {
          code: "23001",
          constraint_name: "coin_currency_id_currency_id_fk",
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/currencies/${currencies[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(inUse.status).toBe(409)
    await expect(inUse.json()).resolves.toMatchObject({
      code: "currency_in_use",
      detail: expect.stringContaining("Face Values"),
    })
  })

  it("sanitizes unexpected persistence failures", async () => {
    const response = await createApp({
      createCurrency: async () => {
        throw new Error("postgresql://secret-database")
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/currencies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({
        code: "united-states-dollar",
        name: "Dollar",
        fullName: "United States dollar",
      }),
    })

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain("secret-database")
  })
})

describe("Currency maintenance OpenAPI", () => {
  it("documents every Currency operation as Collector-protected", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document: {
      paths: Record<
        string,
        Record<string, { security: unknown; tags: string[] }>
      >
    } = await response.json()
    const collection = document.paths["/api/v1/maintenance/currencies"]
    const detail = document.paths["/api/v1/maintenance/currencies/{uuid}"]

    expect(collection.get).toMatchObject({
      tags: ["Currency Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(collection.post).toMatchObject({
      tags: ["Currency Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(detail.get).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.put).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(detail.delete).toMatchObject({
      security: [{ collectorSession: [] }],
    })
  })
})
