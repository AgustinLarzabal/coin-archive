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
    createOrientation: async ({ fields }) => ({
      status: "created" as const,
      orientation: {
        ...orientations[0],
        id: "018f1a11-aaaa-7000-8000-000000000003",
        ...fields,
      },
    }),
    replaceOrientation: async ({ id, fields }) => ({
      status: "updated" as const,
      orientation: {
        ...orientations[0],
        id,
        ...fields,
        version: 2,
      },
    }),
    deleteOrientation: async () => ({
      status: "deleted" as const,
      orientation: orientations[0],
    }),
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

  it("propagates a trusted proxy request ID through sanitized problems", async () => {
    const app = createApp({
      getCollector: async () => null,
      trustProxyHeaders: true,
    })

    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations",
      { headers: { "X-Request-ID": "proxy-request-id" } }
    )

    expect(response.status).toBe(401)
    expect(response.headers.get("x-request-id")).toBe("proxy-request-id")
    await expect(response.json()).resolves.toMatchObject({
      code: "authentication_required",
      requestId: "proxy-request-id",
    })
  })

  it("replaces spoofed request IDs at the direct API boundary", async () => {
    const app = createApp({
      createRequestId: () => "api-request-id",
      getCollector: async () => null,
    })

    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations",
      { headers: { "X-Request-ID": "spoofed-request-id" } }
    )

    expect(response.headers.get("x-request-id")).toBe("api-request-id")
    await expect(response.json()).resolves.toMatchObject({
      requestId: "api-request-id",
    })
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
          etag: '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
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
        etag: '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
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
    expect(maintenanceRateLimit).toHaveBeenCalledWith("collector-id", "read")
  })

  it("uses client IP only as a secondary signal for direct maintenance traffic", async () => {
    const directRateLimit = vi.fn(async () => false)
    const direct = createApp({ maintenanceRateLimit: directRateLimit })
    const directResponse = await direct.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations",
      { headers: { "CF-Connecting-IP": "203.0.113.9" } }
    )

    expect(directResponse.status).toBe(429)
    expect(directRateLimit).toHaveBeenCalledWith(
      "collector-id",
      "read",
      "203.0.113.9"
    )

    const proxiedRateLimit = vi.fn(async () => false)
    const proxied = createApp({
      maintenanceRateLimit: proxiedRateLimit,
      trustProxyHeaders: true,
    })
    const proxiedResponse = await proxied.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations",
      { headers: { "CF-Connecting-IP": "198.51.100.4" } }
    )

    expect(proxiedResponse.status).toBe(429)
    expect(proxiedRateLimit).toHaveBeenCalledWith("collector-id", "read")
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

  it("logs only allowlisted operational metadata for unexpected failures", async () => {
    const writeLog = vi.fn()
    const app = createApp({
      createRequestId: () => "generated-request-id",
      now: vi.fn().mockReturnValueOnce(1_000).mockReturnValueOnce(1_012),
      writeLog,
      listOrientations: async () => {
        throw new Error(
          "postgresql://collector:secret@database?constraint=orientation_code_lower_unique_idx&upload=opaque-reference&url=https://presigned.example"
        )
      },
    })

    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations",
      {
        headers: {
          Authorization: "Bearer secret-credential",
          Cookie: "better-auth.session_token=secret-session",
        },
      }
    )

    expect(response.status).toBe(500)
    expect(writeLog).toHaveBeenCalledWith({
      durationMs: 12,
      method: "GET",
      outcome: "unexpected_error",
      requestId: "generated-request-id",
      route: "/api/v1/maintenance/orientations",
      status: 500,
    })
    expect(JSON.stringify(writeLog.mock.calls)).not.toMatch(
      /collector|secret|database|constraint|opaque-reference|presigned/i
    )
  })
})

describe("protected Orientation maintenance mutations", () => {
  it("rate-limits mutations with the separate Collector mutation budget", async () => {
    const maintenanceRateLimit = vi.fn(async () => false)
    const app = createApp({ maintenanceRateLimit })

    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations",
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
    expect(response.headers.get("retry-after")).toBe("60")
    expect(maintenanceRateLimit).toHaveBeenCalledWith(
      "collector-id",
      "mutation"
    )
  })

  it("authorizes every mutation at the protected API boundary", async () => {
    const request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "reeded", name: "Reeded" }),
    }
    const signedOut = await createApp({
      getCollector: async () => null,
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations",
      request
    )
    const collectorOnly = await createApp({
      getCollector: async () => ({ id: "collector-id", role: "collector" }),
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations",
      request
    )

    expect(signedOut.status).toBe(401)
    expect(collectorOnly.status).toBe(403)
  })

  it("creates with 201, Location, ETag, and replay-safe idempotency", async () => {
    const createOrientation = vi.fn(async ({ fields }) => ({
      status: "created" as const,
      orientation: {
        ...orientations[0],
        id: "018f1a11-aaaa-7000-8000-000000000003",
        ...fields,
      },
    }))
    const app = createApp({ createOrientation })
    const response = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations",
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
    expect(response.headers.get("location")).toMatch(
      /^\/api\/v1\/maintenance\/orientations\//
    )
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    await expect(response.json()).resolves.toMatchObject({
      data: { code: "reeded", name: "Reeded", version: 1 },
    })
    expect(createOrientation).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: "collector-id",
        idempotencyKey: "attempt-1",
        requestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        fields: { code: "reeded", name: "Reeded" },
      })
    )
  })

  it("requires an Idempotency-Key and rejects mismatched reuse", async () => {
    const missingKey = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "reeded", name: "Reeded" }),
      }
    )
    expect(missingKey.status).toBe(400)

    const mismatch = await createApp({
      createOrientation: async () => ({ status: "mismatch" }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/orientations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "reeded", name: "Reeded" }),
    })
    expect(mismatch.status).toBe(409)
    await expect(mismatch.json()).resolves.toMatchObject({
      type: "https://api.coinarchive.app/problems/idempotency-key-reuse",
      code: "idempotency_key_reused",
    })
  })

  it("returns pointer-addressed authoritative validation problems", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/maintenance/orientations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "attempt-1",
        },
        body: JSON.stringify({ code: "Reeded", name: " " }),
      }
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({
      type: "https://api.coinarchive.app/problems/orientation-validation",
      code: "orientation_validation_failed",
      invalidParams: expect.arrayContaining([
        expect.objectContaining({
          name: "/code",
          code: "invalid_orientation_code",
        }),
        expect.objectContaining({
          name: "/name",
          code: "invalid_orientation_name",
        }),
      ]),
    })
  })

  it("replaces with If-Match and returns the incremented representation", async () => {
    const replaceOrientation = vi.fn(async ({ id, fields }) => ({
      status: "updated" as const,
      orientation: { ...orientations[0], id, ...fields, version: 2 },
    }))
    const app = createApp({ replaceOrientation })
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/orientations/${orientations[0].id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
        body: JSON.stringify({ code: "medal-alignment", name: "Medal" }),
      }
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).not.toBe(
      '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"'
    )
    await expect(response.json()).resolves.toMatchObject({
      data: { version: 2, code: "medal-alignment" },
    })
    expect(replaceOrientation).toHaveBeenCalledWith({
      id: orientations[0].id,
      expectedVersion: 1,
      fields: { code: "medal-alignment", name: "Medal" },
    })
  })

  it("returns 412 for stale replacement and deletion preconditions", async () => {
    const app = createApp({
      replaceOrientation: async () => ({ status: "stale" }),
      deleteOrientation: async () => ({ status: "stale" }),
    })
    const headers = {
      "Content-Type": "application/json",
      "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
    }
    const replacement = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/orientations/${orientations[0].id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({ code: "reeded", name: "Reeded" }),
      }
    )
    const deletion = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/orientations/${orientations[0].id}`,
      { method: "DELETE", headers }
    )

    for (const response of [replacement, deletion]) {
      expect(response.status).toBe(412)
      await expect(response.json()).resolves.toMatchObject({
        type: "https://api.coinarchive.app/problems/stale-orientation",
        code: "orientation_precondition_failed",
      })
    }
  })

  it("returns a stable 404 when a mutation target is missing", async () => {
    const app = createApp({
      replaceOrientation: async () => ({ status: "missing" }),
    })
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/orientations/${orientations[0].id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
        body: JSON.stringify({ code: "reeded", name: "Reeded" }),
      }
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({
      type: "https://api.coinarchive.app/problems/orientation-not-found",
      code: "orientation_not_found",
    })
  })

  it("returns stable duplicate and Coin-dependency conflicts", async () => {
    const duplicate = await createApp({
      createOrientation: async () => {
        throw {
          cause: {
            code: "23505",
            constraint_name: "orientation_code_lower_unique_idx",
          },
        }
      },
    }).request("https://api.coinarchive.app/api/v1/maintenance/orientations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "attempt-1",
      },
      body: JSON.stringify({ code: "reeded", name: "Reeded" }),
    })
    expect(duplicate.status).toBe(409)
    await expect(duplicate.json()).resolves.toMatchObject({
      type: "https://api.coinarchive.app/problems/orientation-code-conflict",
      code: "orientation_code_conflict",
    })

    const dependency = await createApp({
      deleteOrientation: async () => {
        throw {
          cause: {
            code: "23001",
            constraint_name: "coin_orientation_id_orientation_id_fk",
          },
        }
      },
    }).request(
      `https://api.coinarchive.app/api/v1/maintenance/orientations/${orientations[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )
    expect(dependency.status).toBe(409)
    await expect(dependency.json()).resolves.toMatchObject({
      type: "https://api.coinarchive.app/problems/orientation-in-use",
      code: "orientation_in_use",
    })
  })

  it("permanently deletes with 204", async () => {
    const response = await createApp().request(
      `https://api.coinarchive.app/api/v1/maintenance/orientations/${orientations[0].id}`,
      {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      }
    )

    expect(response.status).toBe(204)
    expect(await response.text()).toBe("")
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
    expect(
      document.paths["/api/v1/maintenance/orientations"].post
    ).toMatchObject({
      tags: ["Orientation Maintenance"],
      security: [{ collectorSession: [] }],
    })
    expect(
      document.paths["/api/v1/maintenance/orientations/{uuid}"].put
    ).toMatchObject({ security: [{ collectorSession: [] }] })
    expect(
      document.paths["/api/v1/maintenance/orientations/{uuid}"].delete
    ).toMatchObject({ security: [{ collectorSession: [] }] })
  })
})
