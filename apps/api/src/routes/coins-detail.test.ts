import { describe, expect, it } from "vitest"

import { createApp } from "../app.js"

const successfulReadinessCheck = async () => {}

describe("Coin detail route", () => {
  describe("GET /v1/coins/{coinId}", () => {
    const coinId = "00000000-0000-4000-8000-000000000001"
    const issuerId = "10000000-0000-4000-8000-000000000001"
    const coin = {
      id: coinId,
      title: "First coin",
      issuerId,
      denominationId: null,
      denomination: null,
      distribution: "circulating-commemorative" as const,
      distributionName: "Circulating commemorative",
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
      mints: [],
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

    it("returns every confirmed Mint with its own country and operation period", async () => {
      const mint = {
        id: "40000000-0000-4000-8000-000000000001",
        slug: "rome-state-mint-italy",
        name: "Zecca dello Stato",
        place: "Rome",
        countryId: issuerId,
        country: { ...coin.issuer, name: "Italy", code: "IT" },
        startYear: null,
        endYear: null,
        operating: true,
        createdAt: coin.createdAt,
        updatedAt: coin.updatedAt,
      }
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => ({
          ...coin,
          mints: [
            mint,
            {
              ...mint,
              id: "40000000-0000-4000-8000-000000000002",
              slug: "second-mint",
              name: "Second Mint",
              startYear: 2000,
              endYear: 2005,
              operating: false,
            },
            {
              ...mint,
              id: "40000000-0000-4000-8000-000000000003",
              slug: "unknown-status-mint",
              operating: null,
            },
          ],
        }),
        imageBaseUrl: "https://images.coin-archive.example",
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({
        mints: [
          {
            id: mint.id,
            slug: "rome-state-mint-italy",
            name: "Zecca dello Stato",
            place: "Rome",
            country: { name: "Italy", code: "IT" },
            startYear: null,
            endYear: null,
            operating: true,
          },
          {
            id: "40000000-0000-4000-8000-000000000002",
            slug: "second-mint",
            name: "Second Mint",
            place: "Rome",
            country: { name: "Italy", code: "IT" },
            startYear: 2000,
            endYear: 2005,
            operating: false,
          },
          {
            id: "40000000-0000-4000-8000-000000000003",
            slug: "unknown-status-mint",
            name: "Zecca dello Stato",
            place: "Rome",
            country: { name: "Italy", code: "IT" },
            startYear: null,
            endYear: null,
            operating: null,
          },
        ],
      })
    })

    it("returns a newly curated Coin Distribution Slug and name", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => ({
          ...coin,
          distribution: "pattern-issue",
          distributionName: "Pattern issue",
        }),
        imageBaseUrl: "https://images.coin-archive.example",
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({
        distribution: "pattern-issue",
        distributionName: "Pattern issue",
      })
    })

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
        distributionName: "Circulating commemorative",
        firstIssueYear: 2004,
        lastIssueYear: 2004,
        issuer: { name: "Argentina", code: "AR" },
        faceValue: null,
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
        mints: [],
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

    it("returns a populated Face Value without internal catalogue identities", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        imageBaseUrl: "https://images.coin-archive.example",
        findCoinById: async () => ({
          ...coin,
          denominationId: "40000000-0000-4000-8000-000000000001",
          denomination: {
            id: "40000000-0000-4000-8000-000000000001",
            currencyId: "50000000-0000-4000-8000-000000000001",
            label: "2 euro",
            amount: "2.000000000000",
            createdAt: new Date("2026-09-16T08:00:00.000Z"),
            updatedAt: new Date("2026-09-16T08:00:00.000Z"),
            currency: {
              id: "50000000-0000-4000-8000-000000000001",
              slug: "euro",
              name: "Euro",
              periodLabel: "1999–present",
              createdAt: new Date("2026-09-16T08:00:00.000Z"),
              updatedAt: new Date("2026-09-16T08:00:00.000Z"),
            },
          },
        }),
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(200)
      const visibilityResponse = response.clone()
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({
          faceValue: {
            label: "2 euro",
            numericValue: 2,
            currency: {
              slug: "euro",
              name: "Euro",
              fullName: "Euro (1999–present)",
            },
          },
        })
      )
      expect(JSON.stringify(await visibilityResponse.json())).not.toMatch(
        /denomination|numerator|denominator|40000000|50000000/i
      )
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
        distributionName: "Circulating commemorative",
        firstIssueYear: 2004,
        lastIssueYear: 2004,
        issuer: { name: "Argentina", code: "AR" },
        faceValue: null,
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
        rulers: [],
        mints: [],
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
        distributionName: "Circulating commemorative",
        firstIssueYear: 2004,
        lastIssueYear: 2004,
        issuer: { name: "Roman Empire", code: "ROMAN" },
        faceValue: null,
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
        rulers: coin.rulingAuthorityAttributions,
        mints: [],
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
            faceValue: null,
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
              distribution: expect.objectContaining({
                type: "string",
                pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              }),
              distributionName: expect.objectContaining({
                type: "string",
                minLength: 1,
                maxLength: 200,
              }),
              issuer: { $ref: "#/components/schemas/Issuer" },
              faceValue: {
                anyOf: [
                  { $ref: "#/components/schemas/FaceValue" },
                  { nullable: true },
                ],
              },
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
              mints: expect.objectContaining({
                type: "array",
                items: expect.objectContaining({
                  type: "object",
                  required: [
                    "id",
                    "slug",
                    "name",
                    "place",
                    "country",
                    "startYear",
                    "endYear",
                    "operating",
                  ],
                }),
              }),
            }),
            required: expect.arrayContaining([
              "distribution",
              "firstIssueYear",
              "lastIssueYear",
              "faceValue",
              "rulers",
              "mints",
            ]),
          }),
          CoinListResponse: expect.objectContaining({
            properties: expect.objectContaining({
              coins: expect.objectContaining({
                maxItems: 100,
                items: { $ref: "#/components/schemas/CoinListItem" },
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
          CoinListItem: expect.objectContaining({
            properties: expect.objectContaining({
              ...issueYearProperties,
              distribution: expect.objectContaining({
                type: "string",
                pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              }),
              faceValue: {
                anyOf: [
                  { $ref: "#/components/schemas/FaceValue" },
                  { nullable: true },
                ],
              },
            }),
            required: expect.arrayContaining([
              "distribution",
              "firstIssueYear",
              "lastIssueYear",
              "faceValue",
            ]),
          }),
          FaceValue: expect.objectContaining({
            properties: expect.objectContaining({
              label: expect.objectContaining({ type: "string" }),
              numericValue: expect.objectContaining({
                type: "number",
                description: expect.stringContaining(
                  "fixed-precision approximation"
                ),
              }),
              currency: { $ref: "#/components/schemas/Currency" },
            }),
            required: ["label", "numericValue", "currency"],
          }),
          Currency: expect.objectContaining({
            properties: expect.objectContaining({
              slug: expect.objectContaining({ type: "string" }),
              name: expect.objectContaining({ type: "string" }),
              fullName: expect.objectContaining({ type: "string" }),
            }),
            required: ["slug", "name", "fullName"],
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
      const coinListItemSchema = document.components.schemas.CoinListItem as {
        properties: Record<string, unknown>
      }
      expect(coinListItemSchema.properties).not.toHaveProperty("rulers")
      expect(coinListItemSchema.properties).not.toHaveProperty("mints")
      expect(coinListItemSchema.properties).not.toHaveProperty("obverse")
      expect(coinListItemSchema.properties).not.toHaveProperty("reverse")
      expect(coinListItemSchema.properties).not.toHaveProperty("edge")
    })
  })
})
