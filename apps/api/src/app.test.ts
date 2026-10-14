import { describe, expect, it, vi } from "vitest"

import { createApp } from "./app.js"

const successfulReadinessCheck = async () => {}

describe("API", () => {
  it("reports liveness without external dependencies", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    }).request("/health")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: "ok" })
  })

  it("prevents liveness responses from being cached", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    }).request("/health")

    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("reports readiness after the injected dependency succeeds", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: async () => {},
    }).request("/ready")

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({ status: "ok" })
  })

  it("reports safe unavailability while liveness remains healthy", async () => {
    const lines: Array<string> = []
    const requestId = "readiness-request-42"
    const dependencyError =
      "postgresql://operator:fake-secret@database.internal/coin_archive"
    const app = createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: async () => {
        throw new Error(dependencyError, {
          cause: new Error("readiness-cause-sentinel"),
        })
      },
      log: (line) => lines.push(line),
    })

    const readiness = await app.request("/ready", {
      headers: { "x-request-id": requestId },
    })
    const liveness = await app.request("/health")
    const readinessBody = await readiness.json()
    const events = lines.map((line) => JSON.parse(line))
    const readinessFailure = events.find(
      (event) => event.event === "readiness_check_failed"
    )

    expect(readiness.status).toBe(503)
    expect(readiness.headers.get("cache-control")).toBe("no-store")
    expect(readinessBody).toEqual({ status: "unavailable" })
    expect(JSON.stringify(readinessBody)).not.toContain(dependencyError)
    expect(lines.join("\n")).not.toContain(dependencyError)
    expect(lines.join("\n")).not.toContain("readiness-cause-sentinel")
    expect(readinessFailure).toMatchObject({
      level: "error",
      event: "readiness_check_failed",
      requestId,
    })
    expect(readinessFailure?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(readinessFailure).not.toHaveProperty("error")
    expect(readinessFailure).not.toHaveProperty("message")
    expect(readinessFailure).not.toHaveProperty("cause")
    expect(readinessFailure).not.toHaveProperty("stack")
    expect(liveness.status).toBe(200)
    await expect(liveness.json()).resolves.toEqual({ status: "ok" })
  })

  it("preserves bounded request IDs and replaces missing or invalid IDs", async () => {
    const app = createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    })
    const validRequestId = "browser.trace_123:child-4"
    const preserved = await app.request("/health", {
      headers: { "x-request-id": validRequestId },
    })
    const missing = await app.request("/health")
    const invalid = await app.request("/health", {
      headers: { "x-request-id": "invalid request id" },
    })

    expect(preserved.headers.get("x-request-id")).toBe(validRequestId)
    expect(missing.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
    expect(invalid.headers.get("x-request-id")).not.toBe("invalid request id")
  })

  it("allows only configured browser origins without credentials", async () => {
    const app = createApp({
      allowedOrigins: ["https://coin-archive.example"],
      checkReadiness: successfulReadinessCheck,
    })
    const allowed = await app.request("/health", {
      headers: { origin: "https://coin-archive.example" },
    })
    const unlisted = await app.request("/health", {
      headers: { origin: "https://attacker.example" },
    })
    const preflight = await app.request("/health", {
      method: "OPTIONS",
      headers: {
        origin: "https://coin-archive.example",
        "access-control-request-method": "GET",
      },
    })

    expect(allowed.headers.get("access-control-allow-origin")).toBe(
      "https://coin-archive.example"
    )
    expect(allowed.headers.has("access-control-allow-credentials")).toBe(false)
    expect(unlisted.headers.has("access-control-allow-origin")).toBe(false)
    expect(preflight.headers.get("access-control-allow-origin")).toBe(
      "https://coin-archive.example"
    )
    expect(preflight.headers.has("access-control-allow-credentials")).toBe(
      false
    )
    expect(preflight.headers.get("x-request-id")).toBeTruthy()
  })

  it("returns consistent public JSON errors for unknown routes and failures", async () => {
    const lines: Array<string> = []
    const requestId = "unexpected-request-42"
    const dependencyError =
      "postgresql://operator:fake-secret@database.internal/coin_archive"
    const app = createApp({
      allowedOrigins: ["https://coin-archive.example"],
      checkReadiness: successfulReadinessCheck,
      log: (line) => lines.push(line),
    })
    app.get("/unexpected", () => {
      throw new Error(dependencyError, {
        cause: new Error("request-cause-sentinel"),
      })
    })

    const notFound = await app.request("/unknown")
    const unexpected = await app.request("/unexpected", {
      headers: { "x-request-id": requestId },
    })
    const events = lines.map((line) => JSON.parse(line))
    const requestFailure = events.find(
      (event) => event.event === "request_failed"
    )

    expect(notFound.status).toBe(404)
    await expect(notFound.json()).resolves.toEqual({
      error: { code: "not_found", message: "Not found" },
    })
    expect(unexpected.status).toBe(500)
    await expect(unexpected.json()).resolves.toEqual({
      error: { code: "internal_error", message: "Internal server error" },
    })
    expect(unexpected.headers.get("x-request-id")).toBe(requestId)
    expect(lines.join("\n")).not.toContain(dependencyError)
    expect(lines.join("\n")).not.toContain("request-cause-sentinel")
    expect(requestFailure).toMatchObject({
      level: "error",
      event: "request_failed",
      requestId,
    })
    expect(requestFailure?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(requestFailure).not.toHaveProperty("error")
    expect(requestFailure).not.toHaveProperty("message")
    expect(requestFailure).not.toHaveProperty("cause")
    expect(requestFailure).not.toHaveProperty("stack")
  })

  it("serves a generated OpenAPI contract for operational endpoints", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    }).request("/openapi.json")
    const document = (await response.json()) as {
      components: {
        schemas: {
          HealthResponse: unknown
          UnavailableResponse: unknown
        }
      }
      openapi: string
      paths: {
        "/health": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": { schema: unknown }
                }
                headers: Record<string, unknown>
              }
            }
          }
        }
        "/ready": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": { schema: unknown }
                }
              }
              "503": {
                content: {
                  "application/json": { schema: unknown }
                }
              }
            }
          }
        }
      }
    }

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(document.openapi).toBe("3.1.0")
    expect(document.paths).toHaveProperty("/health")
    expect(document.paths).toHaveProperty("/ready")
    expect(document.paths["/ready"].get.responses).toEqual(
      expect.objectContaining({
        "200": expect.any(Object),
        "503": expect.any(Object),
      })
    )
    expect(document.paths["/health"].get.responses["200"].headers).toEqual(
      expect.objectContaining({
        "Cache-Control": expect.any(Object),
        "x-request-id": expect.any(Object),
      })
    )
    expect(document.components.schemas.HealthResponse).toEqual({
      type: "object",
      properties: { status: { type: "string", enum: ["ok"] } },
      required: ["status"],
      additionalProperties: false,
    })
    expect(document.components.schemas.UnavailableResponse).toEqual({
      type: "object",
      properties: { status: { type: "string", enum: ["unavailable"] } },
      required: ["status"],
      additionalProperties: false,
    })
    expect(
      document.paths["/health"].get.responses["200"].content["application/json"]
        .schema
    ).toEqual({ $ref: "#/components/schemas/HealthResponse" })
    expect(
      document.paths["/ready"].get.responses["200"].content["application/json"]
        .schema
    ).toEqual({ $ref: "#/components/schemas/HealthResponse" })
    expect(
      document.paths["/ready"].get.responses["503"].content["application/json"]
        .schema
    ).toEqual({ $ref: "#/components/schemas/UnavailableResponse" })
  })

  it("emits one structured JSON request log", async () => {
    const lines: Array<string> = []
    const app = createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
      log: (line) => lines.push(line),
    })

    await app.request("/health", {
      headers: { "x-request-id": "test-request-42" },
    })

    expect(lines).toHaveLength(1)
    expect(JSON.parse(lines[0] ?? "")).toMatchObject({
      level: "info",
      requestId: "test-request-42",
      method: "GET",
      path: "/health",
      status: 200,
    })
    expect(JSON.parse(lines[0] ?? "").timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(JSON.parse(lines[0] ?? "").durationMs).toBeGreaterThanOrEqual(0)
  })

  describe("GET /v1/coins/{coinId}", () => {
    const coinId = "00000000-0000-4000-8000-000000000001"
    const issuerId = "10000000-0000-4000-8000-000000000001"
    const coin = {
      id: coinId,
      title: "First coin",
      issuerId,
      firstIssueYear: 2004,
      lastIssueYear: 2004,
      issuer: {
        id: issuerId,
        name: "Argentina",
        code: "AR",
        createdAt: new Date("2026-09-16T09:00:00.000Z"),
        updatedAt: new Date("2026-09-16T09:00:00.000Z"),
      },
      createdAt: new Date("2026-09-16T10:00:00.000Z"),
      updatedAt: new Date("2026-09-16T11:00:00.000Z"),
      obverse: {
        id: "20000000-0000-4000-8000-000000000001",
        coinId,
        kind: "obverse" as const,
        description: "A portrait of the sovereign",
        imageKey: "coins/first/obverse image.webp",
        createdAt: new Date("2026-09-16T10:30:00.000Z"),
        updatedAt: new Date("2026-09-16T10:45:00.000Z"),
        engravers: [
          {
            id: "30000000-0000-4000-8000-000000000002",
            slug: "second-engraver",
            fullName: "Second Engraver",
            createdAt: new Date("2026-09-10T10:00:00.000Z"),
            updatedAt: new Date("2026-09-11T10:00:00.000Z"),
          },
          {
            id: "30000000-0000-4000-8000-000000000001",
            slug: "first-engraver",
            fullName: "First Engraver",
            createdAt: new Date("2026-09-08T10:00:00.000Z"),
            updatedAt: new Date("2026-09-09T10:00:00.000Z"),
          },
        ],
      },
      reverse: {
        id: "20000000-0000-4000-8000-000000000002",
        coinId,
        kind: "reverse" as const,
        description: "The national coat of arms",
        imageKey: "coins/first/reverse image.webp",
        createdAt: new Date("2026-09-16T10:31:00.000Z"),
        updatedAt: new Date("2026-09-16T10:46:00.000Z"),
        engravers: [
          {
            id: "30000000-0000-4000-8000-000000000001",
            slug: "first-engraver",
            fullName: "First Engraver",
            createdAt: new Date("2026-09-08T10:00:00.000Z"),
            updatedAt: new Date("2026-09-09T10:00:00.000Z"),
          },
        ],
      },
      edge: {
        id: "20000000-0000-4000-8000-000000000003",
        coinId,
        kind: "edge" as const,
        description: "A lettered inscription",
        imageKey: "coins/first/edge image.webp",
        createdAt: new Date("2026-09-16T10:32:00.000Z"),
        updatedAt: new Date("2026-09-16T10:47:00.000Z"),
      },
    }

    it("returns the Coin contract with UTC timestamps and no caching", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => coin,
        imageBaseUrl: "https://images.coin-archive.example",
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        id: coinId,
        title: "First coin",
        firstIssueYear: 2004,
        lastIssueYear: 2004,
        issuer: { name: "Argentina", code: "AR" },
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
        obverse: {
          description: "A portrait of the sovereign",
          imageUrl:
            "https://images.coin-archive.example/coins/first/obverse%20image.webp",
          createdAt: "2026-09-16T10:30:00.000Z",
          updatedAt: "2026-09-16T10:45:00.000Z",
          engravers: [
            {
              slug: "second-engraver",
              fullName: "Second Engraver",
              createdAt: "2026-09-10T10:00:00.000Z",
              updatedAt: "2026-09-11T10:00:00.000Z",
            },
            {
              slug: "first-engraver",
              fullName: "First Engraver",
              createdAt: "2026-09-08T10:00:00.000Z",
              updatedAt: "2026-09-09T10:00:00.000Z",
            },
          ],
        },
        reverse: {
          description: "The national coat of arms",
          imageUrl:
            "https://images.coin-archive.example/coins/first/reverse%20image.webp",
          createdAt: "2026-09-16T10:31:00.000Z",
          updatedAt: "2026-09-16T10:46:00.000Z",
          engravers: [
            {
              slug: "first-engraver",
              fullName: "First Engraver",
              createdAt: "2026-09-08T10:00:00.000Z",
              updatedAt: "2026-09-09T10:00:00.000Z",
            },
          ],
        },
        edge: {
          description: "A lettered inscription",
          imageUrl:
            "https://images.coin-archive.example/coins/first/edge%20image.webp",
          createdAt: "2026-09-16T10:32:00.000Z",
          updatedAt: "2026-09-16T10:47:00.000Z",
        },
      })
    })

    it("returns a BCE Issue Period unchanged", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => ({
          ...coin,
          firstIssueYear: -44,
          lastIssueYear: -42,
        }),
        imageBaseUrl: "https://images.coin-archive.example",
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({
          firstIssueYear: -44,
          lastIssueYear: -42,
        })
      )
    })

    it("returns explicit missing surface content when no surface is persisted", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => ({
          ...coin,
          obverse: null,
          reverse: null,
          edge: null,
        }),
        imageBaseUrl: "https://images.coin-archive.example",
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        id: coinId,
        title: "First coin",
        firstIssueYear: 2004,
        lastIssueYear: 2004,
        issuer: { name: "Argentina", code: "AR" },
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
        obverse: {
          description: null,
          imageUrl: null,
          createdAt: null,
          updatedAt: null,
          engravers: [],
        },
        reverse: {
          description: null,
          imageUrl: null,
          createdAt: null,
          updatedAt: null,
          engravers: [],
        },
        edge: {
          description: null,
          imageUrl: null,
          createdAt: null,
          updatedAt: null,
        },
      })
    })

    it("returns partial Edge catalogue data", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => ({
          ...coin,
          edge: { ...coin.edge, description: null },
        }),
        imageBaseUrl: "https://images.coin-archive.example",
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({
          edge: {
            description: null,
            imageUrl:
              "https://images.coin-archive.example/coins/first/edge%20image.webp",
            createdAt: "2026-09-16T10:32:00.000Z",
            updatedAt: "2026-09-16T10:47:00.000Z",
          },
        })
      )
    })

    it("returns a partial Reverse while keeping an absent Obverse explicit", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => ({
          ...coin,
          obverse: null,
          reverse: { ...coin.reverse, imageKey: null },
        }),
        imageBaseUrl: "https://images.coin-archive.example",
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({
          obverse: {
            description: null,
            imageUrl: null,
            createdAt: null,
            updatedAt: null,
            engravers: [],
          },
          reverse: {
            description: "The national coat of arms",
            imageUrl: null,
            createdAt: "2026-09-16T10:31:00.000Z",
            updatedAt: "2026-09-16T10:46:00.000Z",
            engravers: [
              {
                slug: "first-engraver",
                fullName: "First Engraver",
                createdAt: "2026-09-08T10:00:00.000Z",
                updatedAt: "2026-09-09T10:00:00.000Z",
              },
            ],
          },
        })
      )
    })

    it("returns an Archive-defined Issuer from detail and list endpoints without internal IDs", async () => {
      const romanCoin = {
        ...coin,
        issuer: {
          ...coin.issuer,
          name: "Roman Empire",
          code: "ROMAN",
        },
      }
      const app = createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => romanCoin,
        listCoins: async () => [
          {
            ...romanCoin,
            obverseImageKey: romanCoin.obverse.imageKey,
            reverseImageKey: romanCoin.reverse.imageKey,
          },
        ],
        imageBaseUrl: "https://images.coin-archive.example",
      })

      const detail = await app.request(`/v1/coins/${coinId}`)
      const list = await app.request("/v1/coins")
      const expectedCoin = {
        id: coinId,
        title: "First coin",
        firstIssueYear: 2004,
        lastIssueYear: 2004,
        issuer: { name: "Roman Empire", code: "ROMAN" },
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
        obverse: {
          description: "A portrait of the sovereign",
          imageUrl:
            "https://images.coin-archive.example/coins/first/obverse%20image.webp",
          createdAt: "2026-09-16T10:30:00.000Z",
          updatedAt: "2026-09-16T10:45:00.000Z",
          engravers: [
            {
              slug: "second-engraver",
              fullName: "Second Engraver",
              createdAt: "2026-09-10T10:00:00.000Z",
              updatedAt: "2026-09-11T10:00:00.000Z",
            },
            {
              slug: "first-engraver",
              fullName: "First Engraver",
              createdAt: "2026-09-08T10:00:00.000Z",
              updatedAt: "2026-09-09T10:00:00.000Z",
            },
          ],
        },
        reverse: {
          description: "The national coat of arms",
          imageUrl:
            "https://images.coin-archive.example/coins/first/reverse%20image.webp",
          createdAt: "2026-09-16T10:31:00.000Z",
          updatedAt: "2026-09-16T10:46:00.000Z",
          engravers: [
            {
              slug: "first-engraver",
              fullName: "First Engraver",
              createdAt: "2026-09-08T10:00:00.000Z",
              updatedAt: "2026-09-09T10:00:00.000Z",
            },
          ],
        },
        edge: {
          description: "A lettered inscription",
          imageUrl:
            "https://images.coin-archive.example/coins/first/edge%20image.webp",
          createdAt: "2026-09-16T10:32:00.000Z",
          updatedAt: "2026-09-16T10:47:00.000Z",
        },
      }

      expect(detail.status).toBe(200)
      await expect(detail.json()).resolves.toEqual(expectedCoin)
      expect(list.status).toBe(200)
      await expect(list.json()).resolves.toEqual({
        coins: [
          {
            id: coinId,
            title: "First coin",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
            issuer: { name: "Roman Empire", code: "ROMAN" },
            createdAt: "2026-09-16T10:00:00.000Z",
            updatedAt: "2026-09-16T11:00:00.000Z",
            obverseImageUrl:
              "https://images.coin-archive.example/coins/first/obverse%20image.webp",
            reverseImageUrl:
              "https://images.coin-archive.example/coins/first/reverse%20image.webp",
          },
        ],
      })
    })

    it("rejects malformed IDs before lookup", async () => {
      let lookupCount = 0
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => {
          lookupCount += 1
          return coin
        },
      }).request("/v1/coins/not-a-uuid")

      expect(response.status).toBe(400)
      expect(response.headers.get("cache-control")).toBe("no-store")
      expect(lookupCount).toBe(0)
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "invalid_coin_id",
          message: "Coin ID must be a valid UUID",
        },
      })
    })

    it("distinguishes a missing Coin", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => null,
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(404)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        error: { code: "coin_not_found", message: "Coin not found" },
      })
    })

    it("keeps lookup failures safe and correlated", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => {
          throw new Error(
            "postgresql://operator:secret@database.internal/coin_archive"
          )
        },
      }).request(`/v1/coins/${coinId}`, {
        headers: { "x-request-id": "coin-request-42" },
      })

      expect(response.status).toBe(500)
      expect(response.headers.get("cache-control")).toBe("no-store")
      expect(response.headers.get("x-request-id")).toBe("coin-request-42")
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      })
    })

    it("documents named success and error schemas", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
      }).request("/openapi.json")
      const document = (await response.json()) as {
        components: { schemas: Record<string, unknown> }
        paths: {
          "/v1/coins/{coinId}": {
            get: { responses: Record<string, unknown> }
          }
        }
      }

      expect(document.paths["/v1/coins/{coinId}"].get.responses).toEqual(
        expect.objectContaining({
          "200": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Coin" },
              },
            },
          }),
          "400": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InvalidCoinIdError" },
              },
            },
          }),
          "404": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CoinNotFoundError" },
              },
            },
          }),
          "500": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InternalError" },
              },
            },
          }),
        })
      )
      expect(document.components.schemas).toEqual(
        expect.objectContaining({
          Coin: expect.objectContaining({
            properties: expect.objectContaining({
              firstIssueYear: { type: "integer" },
              lastIssueYear: { type: "integer" },
              issuer: { $ref: "#/components/schemas/Issuer" },
            }),
            required: expect.arrayContaining([
              "firstIssueYear",
              "lastIssueYear",
            ]),
          }),
          CoinListResponse: expect.objectContaining({
            properties: {
              coins: expect.objectContaining({
                items: expect.objectContaining({
                  properties: expect.objectContaining({
                    firstIssueYear: { type: "integer" },
                    lastIssueYear: { type: "integer" },
                  }),
                  required: expect.arrayContaining([
                    "firstIssueYear",
                    "lastIssueYear",
                  ]),
                }),
              }),
            },
          }),
          Issuer: {
            type: "object",
            properties: {
              name: { type: "string", minLength: 1, maxLength: 200 },
              code: { type: "string", pattern: expect.any(String) },
            },
            required: ["name", "code"],
            additionalProperties: false,
          },
          CoinPathParameters: expect.any(Object),
          InvalidCoinIdError: expect.any(Object),
          CoinNotFoundError: expect.any(Object),
          InternalError: expect.any(Object),
        })
      )
    })
  })

  describe("GET /v1/coins", () => {
    it("passes one exact Engraver Slug to the Coin list", async () => {
      const listCoins = vi.fn(async () => [])

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?engraver=first-archive-engraver")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        engraverSlug: "first-archive-engraver",
      })
      await expect(response.json()).resolves.toEqual({ coins: [] })
    })

    it("combines Issuer and Engraver filters for the Coin list", async () => {
      const listCoins = vi.fn(async () => [])

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?issuer=ROMAN&engraver=first-archive-engraver")

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        issuerCode: "ROMAN",
        engraverSlug: "first-archive-engraver",
      })
    })

    it("passes one exact Issuer Code to the Coin collection", async () => {
      const listCoins = vi.fn(async () => [])

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?issuer=ROMAN")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        issuerCode: "ROMAN",
      })
      await expect(response.json()).resolves.toEqual({ coins: [] })
    })

    it("omits the Coin collection filter when the query parameter is absent", async () => {
      const listCoins = vi.fn(async () => [])

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins")

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith()
    })

    it.each(["", "ar", "A", "ABC_123"])(
      "rejects the malformed Issuer Code %j without listing Coins",
      async (issuerCode) => {
        const listCoins = vi.fn(async () => [])

        const response = await createApp({
          allowedOrigins: [],
          checkReadiness: successfulReadinessCheck,
          listCoins,
        }).request(`/v1/coins?issuer=${encodeURIComponent(issuerCode)}`)

        expect(response.status).toBe(400)
        expect(response.headers.get("cache-control")).toBe("no-store")
        expect(listCoins).not.toHaveBeenCalled()
        await expect(response.json()).resolves.toEqual({
          error: {
            code: "invalid_issuer_code",
            message: "Issuer Code is invalid",
          },
        })
      }
    )

    it("rejects multiple Issuer Code filters without listing Coins", async () => {
      const listCoins = vi.fn(async () => [])

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?issuer=AR&issuer=ROMAN")

      expect(response.status).toBe(400)
      expect(listCoins).not.toHaveBeenCalled()
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "invalid_issuer_code",
          message: "Issuer Code is invalid",
        },
      })
    })

    it.each(["", "First-Engraver", "ab", "first--engraver"])(
      "rejects the malformed Engraver Slug %j without listing Coins",
      async (engraverSlug) => {
        const listCoins = vi.fn(async () => [])

        const response = await createApp({
          allowedOrigins: [],
          checkReadiness: successfulReadinessCheck,
          listCoins,
        }).request(`/v1/coins?engraver=${encodeURIComponent(engraverSlug)}`)

        expect(response.status).toBe(400)
        expect(response.headers.get("cache-control")).toBe("no-store")
        expect(listCoins).not.toHaveBeenCalled()
        await expect(response.json()).resolves.toEqual({
          error: {
            code: "invalid_engraver_slug",
            message: "Engraver Slug is invalid",
          },
        })
      }
    )

    it("rejects multiple Engraver filters without listing Coins", async () => {
      const listCoins = vi.fn(async () => [])

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?engraver=first-engraver&engraver=second-engraver")

      expect(response.status).toBe(400)
      expect(listCoins).not.toHaveBeenCalled()
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "invalid_engraver_slug",
          message: "Engraver Slug is invalid",
        },
      })
    })

    it("returns persisted Coins with UTC timestamps and no caching", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        imageBaseUrl: "https://images.coin-archive.example",
        listCoins: async () => [
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "First coin",
            issuerId: "10000000-0000-4000-8000-000000000001",
            firstIssueYear: -2,
            lastIssueYear: 2,
            issuer: {
              id: "10000000-0000-4000-8000-000000000001",
              name: "Argentina",
              code: "AR",
              createdAt: new Date("2026-09-16T09:00:00.000Z"),
              updatedAt: new Date("2026-09-16T09:00:00.000Z"),
            },
            createdAt: new Date("2026-09-16T10:00:00.000Z"),
            updatedAt: new Date("2026-09-16T11:00:00.000Z"),
            obverseImageKey: "coins/first/obverse.webp",
            reverseImageKey: "coins/first/reverse.webp",
          },
        ],
      }).request("/v1/coins")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        coins: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "First coin",
            firstIssueYear: -2,
            lastIssueYear: 2,
            issuer: { name: "Argentina", code: "AR" },
            createdAt: "2026-09-16T10:00:00.000Z",
            updatedAt: "2026-09-16T11:00:00.000Z",
            obverseImageUrl:
              "https://images.coin-archive.example/coins/first/obverse.webp",
            reverseImageUrl:
              "https://images.coin-archive.example/coins/first/reverse.webp",
          },
        ],
      })
    })

    it("returns an explicit missing Obverse image without detail-only data", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins: async () => [
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "First coin",
            issuerId: "10000000-0000-4000-8000-000000000001",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
            issuer: {
              id: "10000000-0000-4000-8000-000000000001",
              name: "Argentina",
              code: "AR",
              createdAt: new Date("2026-09-16T09:00:00.000Z"),
              updatedAt: new Date("2026-09-16T09:00:00.000Z"),
            },
            createdAt: new Date("2026-09-16T10:00:00.000Z"),
            updatedAt: new Date("2026-09-16T11:00:00.000Z"),
            obverseImageKey: null,
            reverseImageKey: null,
          },
        ],
      }).request("/v1/coins")

      const body = await response.json()
      expect(body).toEqual({
        coins: [
          expect.objectContaining({
            obverseImageUrl: null,
            reverseImageUrl: null,
          }),
        ],
      })
      expect(JSON.stringify(body)).not.toContain("description")
      expect(JSON.stringify(body)).not.toContain("imageKey")
    })

    it("returns an empty Coin list", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins: async () => [],
      }).request("/v1/coins")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({ coins: [] })
    })

    it("keeps Coin list failures safe and uncacheable", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins: async () => {
          throw new Error(
            "postgresql://operator:secret@database.internal/coin_archive"
          )
        },
      }).request("/v1/coins")

      expect(response.status).toBe(500)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      })
    })

    it("documents named Coin list response schemas", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
      }).request("/openapi.json")
      const document = (await response.json()) as {
        components: { schemas: Record<string, unknown> }
        paths: {
          "/v1/coins": {
            get: {
              parameters: Array<Record<string, unknown>>
              responses: Record<string, unknown>
            }
          }
        }
      }

      expect(document.paths["/v1/coins"].get.parameters).toEqual([
        expect.objectContaining({
          description: "Exact, case-sensitive Engraver Slug",
          in: "query",
          name: "engraver",
          required: false,
          schema: expect.objectContaining({ pattern: expect.any(String) }),
        }),
        expect.objectContaining({
          description: "Exact, case-sensitive Issuer Code",
          in: "query",
          name: "issuer",
          required: false,
          schema: expect.objectContaining({ pattern: expect.any(String) }),
        }),
      ])
      expect(document.paths["/v1/coins"].get.responses).toEqual(
        expect.objectContaining({
          "200": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CoinListResponse" },
              },
            },
          }),
          "400": expect.objectContaining({
            content: {
              "application/json": {
                schema: {
                  anyOf: [
                    { $ref: "#/components/schemas/InvalidIssuerCodeError" },
                    { $ref: "#/components/schemas/InvalidEngraverSlugError" },
                  ],
                },
              },
            },
          }),
          "500": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InternalError" },
              },
            },
          }),
        })
      )
      expect(document.components.schemas).toEqual(
        expect.objectContaining({
          CoinListResponse: expect.any(Object),
          InvalidEngraverSlugError: expect.any(Object),
          InvalidIssuerCodeError: expect.any(Object),
          InternalError: expect.any(Object),
        })
      )
    })
  })

  describe("GET /v1/issuers", () => {
    const issuers = [
      {
        id: "10000000-0000-4000-8000-000000000001",
        name: "Argentina",
        code: "AR",
        createdAt: new Date("2026-09-16T09:00:00.000Z"),
        updatedAt: new Date("2026-09-16T09:00:00.000Z"),
      },
      {
        id: "10000000-0000-4000-8000-000000000002",
        name: "Roman Empire",
        code: "ROMAN",
        createdAt: new Date("2026-09-17T09:00:00.000Z"),
        updatedAt: new Date("2026-09-17T09:00:00.000Z"),
      },
    ]

    it("returns only each persisted Issuer's public name and Issuer Code", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listIssuers: async () => issuers,
      }).request("/v1/issuers")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        issuers: [
          { name: "Argentina", code: "AR" },
          { name: "Roman Empire", code: "ROMAN" },
        ],
      })
    })

    it("keeps Issuer collection failures safe and uncacheable", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listIssuers: async () => {
          throw new Error("postgresql://operator:secret@database.internal")
        },
      }).request("/v1/issuers")

      expect(response.status).toBe(500)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      })
    })

    it("documents the public Issuer collection response", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
      }).request("/openapi.json")
      const document = (await response.json()) as {
        paths: {
          "/v1/issuers": { get: { responses: Record<string, unknown> } }
        }
      }

      expect(document.paths["/v1/issuers"].get.responses).toEqual(
        expect.objectContaining({
          "200": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/IssuerListResponse" },
              },
            },
          }),
          "500": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InternalError" },
              },
            },
          }),
        })
      )
    })
  })

  describe("GET /v1/engravers", () => {
    it("returns exactly each canonical Engraver's public Slug and full name", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listEngravers: async () => [
          {
            id: "30000000-0000-4000-8000-000000000001",
            slug: "first-engraver",
            fullName: "First Engraver",
            createdAt: new Date("2026-09-16T09:00:00.000Z"),
            updatedAt: new Date("2026-09-17T09:00:00.000Z"),
          },
        ],
      }).request("/v1/engravers")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
      })
    })

    it("keeps Engraver list failures safe and uncacheable", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listEngravers: async () => {
          throw new Error("postgresql://operator:secret@database.internal")
        },
      }).request("/v1/engravers")

      expect(response.status).toBe(500)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      })
    })

    it("documents the public Engraver list response", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
      }).request("/openapi.json")
      const document = (await response.json()) as {
        paths: {
          "/v1/engravers": { get: { responses: Record<string, unknown> } }
        }
      }

      expect(document.paths["/v1/engravers"].get.responses).toEqual(
        expect.objectContaining({
          "200": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EngraverListResponse" },
              },
            },
          }),
          "500": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InternalError" },
              },
            },
          }),
        })
      )
    })
  })
})
