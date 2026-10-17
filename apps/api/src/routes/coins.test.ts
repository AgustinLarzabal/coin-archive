import { describe, expect, it, vi } from "vitest"

import { createApp } from "../app.js"

const successfulReadinessCheck = async () => {}
const emptyCoinPage = async () => ({ coins: [], totalItems: 0 })
const emptyCoinListResponse = {
  coins: [],
  pagination: {
    page: 1,
    pageSize: 24,
    totalItems: 0,
    totalPages: 0,
  },
}

describe("Coin routes", () => {
  describe("GET /v1/coins/{coinId}", () => {
    const coinId = "00000000-0000-4000-8000-000000000001"
    const issuerId = "10000000-0000-4000-8000-000000000001"
    const coin = {
      id: coinId,
      title: "First coin",
      issuerId,
      distribution: "circulating-commemorative" as const,
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
      rulingAuthorityAttributions: [
        {
          slug: "first-authority",
          name: "First Authority",
          role: "Period",
          tenure: "2000–present",
        },
        {
          slug: "second-authority",
          name: "Second Authority",
          role: "Co-ruler",
          tenure: null,
        },
      ],
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
        distribution: "circulating-commemorative",
        firstIssueYear: 2004,
        lastIssueYear: 2004,
        issuer: { name: "Argentina", code: "AR" },
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
        rulers: [
          {
            slug: "first-authority",
            name: "First Authority",
            role: "Period",
            tenure: "2000–present",
          },
          {
            slug: "second-authority",
            name: "Second Authority",
            role: "Co-ruler",
            tenure: null,
          },
        ],
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
          rulingAuthorityAttributions: [],
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
        distribution: "circulating-commemorative",
        firstIssueYear: 2004,
        lastIssueYear: 2004,
        issuer: { name: "Argentina", code: "AR" },
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
        rulers: [],
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
        listCoins: async () => ({
          coins: [
            {
              ...romanCoin,
              obverseImageKey: romanCoin.obverse.imageKey,
              reverseImageKey: romanCoin.reverse.imageKey,
            },
          ],
          totalItems: 1,
        }),
        imageBaseUrl: "https://images.coin-archive.example",
      })

      const detail = await app.request(`/v1/coins/${coinId}`)
      const list = await app.request("/v1/coins")
      const expectedCoin = {
        id: coinId,
        title: "First coin",
        distribution: "circulating-commemorative",
        firstIssueYear: 2004,
        lastIssueYear: 2004,
        issuer: { name: "Roman Empire", code: "ROMAN" },
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
        rulers: coin.rulingAuthorityAttributions,
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
            distribution: "circulating-commemorative",
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
        pagination: {
          page: 1,
          pageSize: 24,
          totalItems: 1,
          totalPages: 1,
        },
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
      const issueYearProperties = {
        firstIssueYear: expect.objectContaining({
          description:
            "Signed conventional Issue Year: negative values are BCE, positive values are CE, and zero is invalid. Must be less than or equal to lastIssueYear.",
          not: { const: 0 },
          type: "integer",
        }),
        lastIssueYear: expect.objectContaining({
          description:
            "Signed conventional Issue Year: negative values are BCE, positive values are CE, and zero is invalid. Must be greater than or equal to firstIssueYear.",
          not: { const: 0 },
          type: "integer",
        }),
      }

      expect(document.components.schemas).toEqual(
        expect.objectContaining({
          Coin: expect.objectContaining({
            properties: expect.objectContaining({
              ...issueYearProperties,
              distribution: {
                type: "string",
                enum: [
                  "standard-circulation",
                  "circulating-commemorative",
                  "non-circulating",
                ],
              },
              issuer: { $ref: "#/components/schemas/Issuer" },
              rulers: expect.objectContaining({
                type: "array",
                items: expect.objectContaining({
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    slug: expect.objectContaining({
                      minLength: 3,
                      maxLength: 64,
                      pattern: expect.any(String),
                    }),
                    name: {
                      type: "string",
                      minLength: 1,
                      maxLength: 200,
                      pattern: expect.any(String),
                    },
                    role: {
                      type: "string",
                      minLength: 1,
                      maxLength: 100,
                      pattern: expect.any(String),
                    },
                    tenure: {
                      type: "string",
                      minLength: 1,
                      maxLength: 200,
                      pattern: expect.any(String),
                      nullable: true,
                    },
                  },
                  required: ["slug", "name", "role", "tenure"],
                }),
              }),
            }),
            required: expect.arrayContaining([
              "distribution",
              "firstIssueYear",
              "lastIssueYear",
              "rulers",
            ]),
          }),
          CoinListResponse: expect.objectContaining({
            properties: expect.objectContaining({
              coins: expect.objectContaining({
                maxItems: 100,
                items: expect.objectContaining({
                  properties: expect.objectContaining({
                    ...issueYearProperties,
                    distribution: {
                      type: "string",
                      enum: [
                        "standard-circulation",
                        "circulating-commemorative",
                        "non-circulating",
                      ],
                    },
                  }),
                  required: expect.arrayContaining([
                    "distribution",
                    "firstIssueYear",
                    "lastIssueYear",
                  ]),
                }),
              }),
              pagination: expect.objectContaining({
                additionalProperties: false,
                properties: {
                  page: { type: "integer", minimum: 1 },
                  pageSize: { type: "integer", minimum: 1, maximum: 100 },
                  totalItems: { type: "integer", minimum: 0 },
                  totalPages: { type: "integer", minimum: 0 },
                },
                required: ["page", "pageSize", "totalItems", "totalPages"],
              }),
            }),
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
      const coinListItemSchema = (
        document.components.schemas.CoinListResponse as {
          properties: {
            coins: { items: { properties: Record<string, unknown> } }
          }
        }
      ).properties.coins.items
      expect(coinListItemSchema.properties).not.toHaveProperty("rulers")
    })
  })

  describe("GET /v1/coins", () => {
    it("uses bounded pagination defaults and returns exact metadata", async () => {
      const listCoins = vi.fn(async () => ({ coins: [], totalItems: 49 }))

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins")

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        page: 1,
        pageSize: 24,
      })
      await expect(response.json()).resolves.toEqual({
        coins: [],
        pagination: {
          page: 1,
          pageSize: 24,
          totalItems: 49,
          totalPages: 3,
        },
      })
    })

    it("passes a requested page and maximum page size to the Coin list", async () => {
      const listCoins = vi.fn(async () => ({ coins: [], totalItems: 201 }))

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?page=3&pageSize=100")

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        page: 3,
        pageSize: 100,
      })
      await expect(response.json()).resolves.toEqual({
        coins: [],
        pagination: {
          page: 3,
          pageSize: 100,
          totalItems: 201,
          totalPages: 3,
        },
      })
    })

    it("returns an empty successful page beyond the result range", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins: async () => ({ coins: [], totalItems: 1 }),
      }).request("/v1/coins?page=2&pageSize=24")

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        coins: [],
        pagination: {
          page: 2,
          pageSize: 24,
          totalItems: 1,
          totalPages: 1,
        },
      })
    })

    it("never returns more than the requested bounded page size", async () => {
      const coin = {
        id: "00000000-0000-4000-8000-000000000001",
        title: "Bounded coin",
        issuerId: "10000000-0000-4000-8000-000000000001",
        distribution: "circulating-commemorative" as const,
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
      }
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins: async () => ({
          coins: Array.from({ length: 101 }, () => coin),
          totalItems: 101,
        }),
      }).request("/v1/coins?pageSize=100")

      expect(response.status).toBe(200)
      const body = (await response.json()) as { coins: Array<unknown> }
      expect(body.coins).toHaveLength(100)
    })

    it.each([
      ["page", "0"],
      ["page", "1.5"],
      ["page", "0x10"],
      ["page", "1e2"],
      ["page", "%201%20"],
      ["pageSize", "0"],
      ["pageSize", "101"],
      ["pageSize", "1.5"],
      ["pageSize", "0x10"],
    ])(
      "rejects invalid %s value %s without listing Coins",
      async (parameter, value) => {
        const listCoins = vi.fn(async () => ({ coins: [], totalItems: 0 }))

        const response = await createApp({
          allowedOrigins: [],
          checkReadiness: successfulReadinessCheck,
          listCoins,
        }).request(`/v1/coins?${parameter}=${value}`)

        expect(response.status).toBe(400)
        expect(listCoins).not.toHaveBeenCalled()
        await expect(response.json()).resolves.toEqual({
          error: {
            code: "invalid_pagination",
            message: "Pagination is invalid",
          },
        })
      }
    )

    it("passes one exact Engraver Slug to the Coin list", async () => {
      const listCoins = vi.fn(emptyCoinPage)

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?engraver=first-archive-engraver")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        engraverSlug: "first-archive-engraver",
        page: 1,
        pageSize: 24,
      })
      await expect(response.json()).resolves.toEqual(emptyCoinListResponse)
    })

    it("passes one exact Ruling Authority Slug with every other filter", async () => {
      const listCoins = vi.fn(emptyCoinPage)

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request(
        "/v1/coins?issuer=ROMAN&ruler=augustus&engraver=first-archive-engraver&year=-25-19&page=2&pageSize=12"
      )

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        issuerCode: "ROMAN",
        rulingAuthoritySlug: "augustus",
        engraverSlug: "first-archive-engraver",
        issueYearInterval: { firstIssueYear: -25, lastIssueYear: 19 },
        page: 2,
        pageSize: 12,
      })
    })

    it("passes one exact Distribution with every other filter", async () => {
      const listCoins = vi.fn(emptyCoinPage)

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request(
        "/v1/coins?distribution=non-circulating&issuer=ROMAN&ruler=augustus&engraver=first-archive-engraver&year=-25-19&page=2&pageSize=12"
      )

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        distribution: "non-circulating",
        issuerCode: "ROMAN",
        rulingAuthoritySlug: "augustus",
        engraverSlug: "first-archive-engraver",
        issueYearInterval: { firstIssueYear: -25, lastIssueYear: 19 },
        page: 2,
        pageSize: 12,
      })
      await expect(response.json()).resolves.toEqual({
        coins: [],
        pagination: {
          page: 2,
          pageSize: 12,
          totalItems: 0,
          totalPages: 0,
        },
      })
    })

    it.each(["", "Non-circulating", "unknown", "standard_circulation"])(
      "rejects the invalid Distribution %j without listing Coins",
      async (distribution) => {
        const listCoins = vi.fn(emptyCoinPage)
        const response = await createApp({
          allowedOrigins: [],
          checkReadiness: successfulReadinessCheck,
          listCoins,
        }).request(`/v1/coins?distribution=${encodeURIComponent(distribution)}`)

        expect(response.status).toBe(400)
        expect(listCoins).not.toHaveBeenCalled()
        await expect(response.json()).resolves.toEqual({
          error: {
            code: "invalid_distribution",
            message: "Coin Distribution is invalid",
          },
        })
      }
    )

    it("rejects repeated Distribution filters without listing Coins", async () => {
      const listCoins = vi.fn(emptyCoinPage)
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request(
        "/v1/coins?distribution=standard-circulation&distribution=non-circulating"
      )

      expect(response.status).toBe(400)
      expect(listCoins).not.toHaveBeenCalled()
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "invalid_distribution",
          message: "Coin Distribution is invalid",
        },
      })
    })

    it("returns an empty page for a well-formed missing Ruling Authority Slug", async () => {
      const listCoins = vi.fn(emptyCoinPage)

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?ruler=missing-authority")

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        rulingAuthoritySlug: "missing-authority",
        page: 1,
        pageSize: 24,
      })
      await expect(response.json()).resolves.toEqual(emptyCoinListResponse)
    })

    it.each(["", "Augustus", "ab", "first--ruler"])(
      "rejects the malformed Ruling Authority Slug %j without listing Coins",
      async (rulerSlug) => {
        const listCoins = vi.fn(emptyCoinPage)
        const response = await createApp({
          allowedOrigins: [],
          checkReadiness: successfulReadinessCheck,
          listCoins,
        }).request(`/v1/coins?ruler=${encodeURIComponent(rulerSlug)}`)

        expect(response.status).toBe(400)
        expect(listCoins).not.toHaveBeenCalled()
        await expect(response.json()).resolves.toEqual({
          error: {
            code: "invalid_ruler_slug",
            message: "Ruling Authority Slug is invalid",
          },
        })
      }
    )

    it("rejects repeated Ruling Authority filters without listing Coins", async () => {
      const listCoins = vi.fn(emptyCoinPage)
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?ruler=first-ruler&ruler=second-ruler")

      expect(response.status).toBe(400)
      expect(listCoins).not.toHaveBeenCalled()
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "invalid_ruler_slug",
          message: "Ruling Authority Slug is invalid",
        },
      })
    })

    it("combines Issuer and Engraver filters for the Coin list", async () => {
      const listCoins = vi.fn(emptyCoinPage)

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?issuer=ROMAN&engraver=first-archive-engraver")

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        issuerCode: "ROMAN",
        engraverSlug: "first-archive-engraver",
        page: 1,
        pageSize: 24,
      })
    })

    it("passes one CE Issue Year as a one-year interval with the other filters", async () => {
      const listCoins = vi.fn(emptyCoinPage)

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request(
        "/v1/coins?issuer=ROMAN&engraver=first-archive-engraver&year=1986"
      )

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        issuerCode: "ROMAN",
        engraverSlug: "first-archive-engraver",
        issueYearInterval: { firstIssueYear: 1986, lastIssueYear: 1986 },
        page: 1,
        pageSize: 24,
      })
      await expect(response.json()).resolves.toEqual(emptyCoinListResponse)
    })

    it("passes one canonical BCE Issue Year as a one-year interval with the other filters", async () => {
      const listCoins = vi.fn(emptyCoinPage)

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request(
        "/v1/coins?issuer=ROMAN&engraver=first-archive-engraver&year=-44"
      )

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        issuerCode: "ROMAN",
        engraverSlug: "first-archive-engraver",
        issueYearInterval: { firstIssueYear: -44, lastIssueYear: -44 },
        page: 1,
        pageSize: 24,
      })
      await expect(response.json()).resolves.toEqual(emptyCoinListResponse)
    })

    it("passes one canonical CE range as an inclusive overlap interval with the other filters", async () => {
      const listCoins = vi.fn(emptyCoinPage)

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request(
        "/v1/coins?issuer=ROMAN&engraver=first-archive-engraver&year=1986-1990"
      )

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        issuerCode: "ROMAN",
        engraverSlug: "first-archive-engraver",
        issueYearInterval: { firstIssueYear: 1986, lastIssueYear: 1990 },
        page: 1,
        pageSize: 24,
      })
      await expect(response.json()).resolves.toEqual(emptyCoinListResponse)
    })

    it.each([
      ["-400--300", { firstIssueYear: -400, lastIssueYear: -300 }],
      ["-25-19", { firstIssueYear: -25, lastIssueYear: 19 }],
    ])(
      "passes the canonical %s range as an inclusive overlap interval",
      async (year, issueYearInterval) => {
        const listCoins = vi.fn(emptyCoinPage)

        const response = await createApp({
          allowedOrigins: [],
          checkReadiness: successfulReadinessCheck,
          listCoins,
        }).request(
          `/v1/coins?issuer=ROMAN&engraver=first-archive-engraver&year=${year}&page=2&pageSize=12`
        )

        expect(response.status).toBe(200)
        expect(listCoins).toHaveBeenCalledExactlyOnceWith({
          issuerCode: "ROMAN",
          engraverSlug: "first-archive-engraver",
          issueYearInterval,
          page: 2,
          pageSize: 12,
        })
      }
    )

    it.each([
      "",
      "0",
      "-0",
      "+44",
      "-044",
      "--44",
      "44 BCE",
      "1986-",
      "1990-1986",
      "0-1986",
      "1986-0",
      "1986--1990",
      "-300--400",
      "25--19",
      "-25-0",
      "0-19",
      "1986-1990-1994",
      "1986–1990",
      "1986 - 1990",
      "1986,1988",
      "1.5",
      " 1986 ",
    ])(
      "rejects the invalid Issue Year %j without listing Coins",
      async (year) => {
        const listCoins = vi.fn(emptyCoinPage)

        const response = await createApp({
          allowedOrigins: [],
          checkReadiness: successfulReadinessCheck,
          listCoins,
        }).request(`/v1/coins?year=${encodeURIComponent(year)}`)

        expect(response.status).toBe(400)
        expect(listCoins).not.toHaveBeenCalled()
        await expect(response.json()).resolves.toEqual({
          error: {
            code: "invalid_year",
            message: "Issue Year is invalid",
          },
        })
      }
    )

    it("rejects repeated Issue Year filters without listing Coins", async () => {
      const listCoins = vi.fn(emptyCoinPage)

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?year=1986&year=1987")

      expect(response.status).toBe(400)
      expect(listCoins).not.toHaveBeenCalled()
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "invalid_year",
          message: "Issue Year is invalid",
        },
      })
    })

    it("passes one exact Issuer Code to the Coin collection", async () => {
      const listCoins = vi.fn(emptyCoinPage)

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins?issuer=ROMAN")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        issuerCode: "ROMAN",
        page: 1,
        pageSize: 24,
      })
      await expect(response.json()).resolves.toEqual(emptyCoinListResponse)
    })

    it("omits the Coin collection filter when the query parameter is absent", async () => {
      const listCoins = vi.fn(emptyCoinPage)

      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins,
      }).request("/v1/coins")

      expect(response.status).toBe(200)
      expect(listCoins).toHaveBeenCalledExactlyOnceWith({
        page: 1,
        pageSize: 24,
      })
    })

    it.each(["", "ar", "A", "ABC_123"])(
      "rejects the malformed Issuer Code %j without listing Coins",
      async (issuerCode) => {
        const listCoins = vi.fn(emptyCoinPage)

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
      const listCoins = vi.fn(emptyCoinPage)

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
        const listCoins = vi.fn(emptyCoinPage)

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
      const listCoins = vi.fn(emptyCoinPage)

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
        listCoins: async () => ({
          coins: [
            {
              id: "00000000-0000-4000-8000-000000000001",
              title: "First coin",
              issuerId: "10000000-0000-4000-8000-000000000001",
              distribution: "standard-circulation",
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
          totalItems: 1,
        }),
      }).request("/v1/coins")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        coins: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "First coin",
            distribution: "standard-circulation",
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
        pagination: {
          page: 1,
          pageSize: 24,
          totalItems: 1,
          totalPages: 1,
        },
      })
    })

    it("returns an explicit missing Obverse image without detail-only data", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins: async () => ({
          coins: [
            {
              id: "00000000-0000-4000-8000-000000000001",
              title: "First coin",
              issuerId: "10000000-0000-4000-8000-000000000001",
              distribution: "circulating-commemorative",
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
          totalItems: 1,
        }),
      }).request("/v1/coins")

      const body = await response.json()
      expect(body).toEqual({
        coins: [
          expect.objectContaining({
            obverseImageUrl: null,
            reverseImageUrl: null,
          }),
        ],
        pagination: {
          page: 1,
          pageSize: 24,
          totalItems: 1,
          totalPages: 1,
        },
      })
      expect(JSON.stringify(body)).not.toContain("description")
      expect(JSON.stringify(body)).not.toContain("imageKey")
    })

    it("returns an empty Coin list", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins: emptyCoinPage,
      }).request("/v1/coins")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual(emptyCoinListResponse)
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
          description: "Exact, case-sensitive Coin Distribution identifier",
          in: "query",
          name: "distribution",
          required: false,
          schema: expect.objectContaining({
            type: "string",
            enum: [
              "standard-circulation",
              "circulating-commemorative",
              "non-circulating",
            ],
          }),
        }),
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
        expect.objectContaining({
          description: "Exact, case-sensitive Ruling Authority Slug",
          in: "query",
          name: "ruler",
          required: false,
        }),
        expect.objectContaining({
          description:
            "One signed conventional Issue Year contained by the Coin's Issue Period, or a canonical signed closed range whose inclusive boundaries overlap the Issue Period (for example, -400--300, -25-19, or 1986-1990). Negative values are BCE and positive values are CE. Malformed, zero, reversed, open-ended, and repeated values return invalid_year",
          in: "query",
          name: "year",
          required: false,
          schema: expect.objectContaining({
            pattern: "^(?:-?[1-9]\\d*|-?[1-9]\\d*--?[1-9]\\d*)$",
            type: "string",
          }),
        }),
        expect.objectContaining({
          description: "One-based page number",
          in: "query",
          name: "page",
          required: false,
          schema: expect.objectContaining({
            default: 1,
            minimum: 1,
            type: "integer",
          }),
        }),
        expect.objectContaining({
          description: "Number of Coins per page (maximum 100)",
          in: "query",
          name: "pageSize",
          required: false,
          schema: expect.objectContaining({
            default: 24,
            maximum: 100,
            minimum: 1,
            type: "integer",
          }),
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
                    { $ref: "#/components/schemas/InvalidDistributionError" },
                    { $ref: "#/components/schemas/InvalidIssuerCodeError" },
                    { $ref: "#/components/schemas/InvalidEngraverSlugError" },
                    {
                      $ref: "#/components/schemas/InvalidRulingAuthoritySlugError",
                    },
                    { $ref: "#/components/schemas/InvalidYearError" },
                    { $ref: "#/components/schemas/InvalidPaginationError" },
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
          InvalidDistributionError: expect.any(Object),
          InvalidEngraverSlugError: expect.any(Object),
          InvalidIssuerCodeError: expect.any(Object),
          InvalidRulingAuthoritySlugError: expect.any(Object),
          InvalidYearError: expect.any(Object),
          InvalidPaginationError: expect.any(Object),
          InternalError: expect.any(Object),
        })
      )
    })
  })
})
