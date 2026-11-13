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
      slug: null,
      issuerId,
      denominationId: null,
      denomination: null,
      distribution: "circulating-commemorative" as const,
      distributionName: "Circulating commemorative",
      composition: null,
      compositionName: null,
      compositionDetail: null,
      demonetized: null,
      orientation: null,
      firstIssueYear: 2004,
      lastIssueYear: 2004,
      size: null,
      thickness: null,
      weight: null,
      shape: null,
      shapeName: null,
      technique: null,
      techniqueName: null,
      issuer: {
        id: issuerId,
        name: "Argentina",
        code: "AR",
        slug: null,
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
      tags: [],
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

    it.each([true, false, null] as const)(
      "returns %s Demonetization Status in Coin detail",
      async (demonetized) => {
        const updatedCoin = { ...coin, demonetized }
        const app = createApp({
          allowedOrigins: [],
          checkReadiness: successfulReadinessCheck,
          findCoinById: async () => updatedCoin,
          imageBaseUrl: "https://images.coin-archive.example",
        })
        await expect(
          (await app.request(`/v1/coins/${coinId}`)).json()
        ).resolves.toMatchObject({ demonetized })
      }
    )

    it("returns assigned Tags on detail and omits them from list items", async () => {
      const taggedCoin = { ...coin, tags: [{ slug: "map", name: "Map" }] }
      const app = createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => taggedCoin,
        listCoins: async () => ({
          coins: [
            {
              ...taggedCoin,
              obverseImageKey: null,
              reverseImageKey: null,
            },
          ],
          totalItems: 1,
        }),
        imageBaseUrl: "https://images.coin-archive.example",
      })

      const detail = await app.request(`/v1/coins/${coinId}`)
      await expect(detail.json()).resolves.toMatchObject({
        tags: [{ slug: "map", name: "Map" }],
      })
      const list = await app.request("/v1/coins")
      expect(
        ((await list.json()) as { coins: Array<unknown> }).coins[0]
      ).not.toHaveProperty("tags")
    })

    it.each(["Medal", "Coin", null] as const)(
      "returns %s Orientation on detail and omits it from list items",
      async (orientation) => {
        const orientedCoin = { ...coin, orientation }
        const app = createApp({
          allowedOrigins: [],
          checkReadiness: successfulReadinessCheck,
          findCoinById: async () => orientedCoin,
          listCoins: async () => ({
            coins: [
              { ...orientedCoin, obverseImageKey: null, reverseImageKey: null },
            ],
            totalItems: 1,
          }),
          imageBaseUrl: "https://images.coin-archive.example",
        })
        await expect(
          (await app.request(`/v1/coins/${coinId}`)).json()
        ).resolves.toMatchObject({ orientation })
        const list = (await (await app.request("/v1/coins")).json()) as {
          coins: Array<unknown>
        }
        expect(list.coins[0]).not.toHaveProperty("orientation")
      }
    )

    it("returns a known Shape on detail and omits it from list items", async () => {
      const shapedCoin = { ...coin, shape: "circular", shapeName: "Circular" }
      const app = createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => shapedCoin,
        listCoins: async () => ({
          coins: [
            { ...shapedCoin, obverseImageKey: null, reverseImageKey: null },
          ],
          totalItems: 1,
        }),
        imageBaseUrl: "https://images.coin-archive.example",
      })

      const detail = await app.request(`/v1/coins/${coinId}`)
      await expect(detail.json()).resolves.toMatchObject({ shape: "circular" })
      const list = await app.request("/v1/coins")
      expect(
        ((await list.json()) as { coins: Array<unknown> }).coins[0]
      ).not.toHaveProperty("shape")
    })

    it("returns current Technique on detail and omits it from list items", async () => {
      const knownCoin = {
        ...coin,
        technique: "milled",
        techniqueName: "Machine struck",
      }
      const app = createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => knownCoin,
        listCoins: async () => ({
          coins: [
            { ...knownCoin, obverseImageKey: null, reverseImageKey: null },
          ],
          totalItems: 1,
        }),
        imageBaseUrl: "https://images.coin-archive.example",
      })
      await expect(
        (await app.request(`/v1/coins/${coinId}`)).json()
      ).resolves.toMatchObject({
        technique: "milled",
        techniqueName: "Machine struck",
      })
      const list = (await (await app.request("/v1/coins")).json()) as {
        coins: Array<unknown>
      }
      expect(list.coins[0]).not.toHaveProperty("technique")
      expect(list.coins[0]).not.toHaveProperty("techniqueName")
    })

    it("returns every confirmed Mint with its own country", async () => {
      const mint = {
        id: "40000000-0000-4000-8000-000000000001",
        slug: "rome-state-mint-italy",
        name: "Zecca dello Stato",
        place: "Rome",
        countryId: issuerId,
        country: { ...coin.issuer, name: "Italy", code: "IT" },
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
            },
            {
              ...mint,
              id: "40000000-0000-4000-8000-000000000003",
              slug: "unknown-status-mint",
            },
          ],
        }),
        imageBaseUrl: "https://images.coin-archive.example",
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(200)
      const { mints } = (await response.json()) as { mints: Array<unknown> }
      expect(mints).toEqual([
        {
          slug: "rome-state-mint-italy",
          name: "Zecca dello Stato",
          place: "Rome",
          country: { name: "Italy", code: "IT" },
        },
        {
          slug: "second-mint",
          name: "Second Mint",
          place: "Rome",
          country: { name: "Italy", code: "IT" },
        },
        {
          slug: "unknown-status-mint",
          name: "Zecca dello Stato",
          place: "Rome",
          country: { name: "Italy", code: "IT" },
        },
      ])
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

    it.each([
      [null, null, null],
      ["bimetallic", "Bimetallic", null],
      [null, null, "Copper and nickel"],
      ["bimetallic", "Bimetallic", "Copper and nickel"],
    ])(
      "returns independent Composition and Detail values",
      async (composition, compositionName, compositionDetail) => {
        const response = await createApp({
          allowedOrigins: [],
          checkReadiness: successfulReadinessCheck,
          findCoinById: async () => ({
            ...coin,
            composition,
            compositionName,
            compositionDetail,
          }),
          imageBaseUrl: "https://images.coin-archive.example",
        }).request(`/v1/coins/${coinId}`)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
          composition,
          compositionName,
          compositionDetail,
        })
      }
    )

    it("returns independently known numeric measurements", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => ({ ...coin, size: 25.75, weight: 8.125 }),
        imageBaseUrl: "https://images.coin-archive.example",
      }).request(`/v1/coins/${coinId}`)
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({
        size: 25.75,
        thickness: null,
        weight: 8.125,
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
        orientation: null,
        composition: null,
        compositionName: null,
        compositionDetail: null,
        demonetized: null,
        shape: null,
        shapeName: null,
        technique: null,
        techniqueName: null,
        size: null,
        thickness: null,
        weight: null,
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
        tags: [],
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
            },
            {
              slug: "first-engraver",
              fullName: "First Engraver",
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
        orientation: null,
        composition: null,
        compositionName: null,
        compositionDetail: null,
        demonetized: null,
        shape: null,
        shapeName: null,
        technique: null,
        techniqueName: null,
        size: null,
        thickness: null,
        weight: null,
        firstIssueYear: 2004,
        lastIssueYear: 2004,
        issuer: { name: "Argentina", code: "AR" },
        faceValue: null,
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
        rulers: [],
        mints: [],
        tags: [],
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
        orientation: null,
        composition: null,
        compositionName: null,
        compositionDetail: null,
        demonetized: null,
        shape: null,
        shapeName: null,
        technique: null,
        techniqueName: null,
        size: null,
        thickness: null,
        weight: null,
        firstIssueYear: 2004,
        lastIssueYear: 2004,
        issuer: { name: "Roman Empire", code: "ROMAN" },
        faceValue: null,
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
        rulers: coin.rulingAuthorityAttributions,
        mints: [],
        tags: [],
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
            },
            {
              slug: "first-engraver",
              fullName: "First Engraver",
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
              composition: expect.objectContaining({ nullable: true }),
              compositionName: expect.objectContaining({ nullable: true }),
              compositionDetail: expect.objectContaining({ nullable: true }),
              demonetized: expect.objectContaining({
                type: "boolean",
                nullable: true,
              }),
              shape: expect.objectContaining({ nullable: true }),
              shapeName: expect.objectContaining({ nullable: true }),
              technique: expect.objectContaining({ nullable: true }),
              techniqueName: expect.objectContaining({ nullable: true }),
              size: expect.objectContaining({ type: "number", nullable: true }),
              thickness: expect.objectContaining({
                type: "number",
                nullable: true,
              }),
              weight: expect.objectContaining({
                type: "number",
                nullable: true,
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
                  required: ["slug", "name", "place", "country"],
                }),
              }),
              tags: expect.objectContaining({
                type: "array",
                items: expect.objectContaining({
                  type: "object",
                  required: ["slug", "name"],
                }),
              }),
            }),
            required: expect.arrayContaining([
              "distribution",
              "composition",
              "compositionName",
              "compositionDetail",
              "demonetized",
              "firstIssueYear",
              "lastIssueYear",
              "faceValue",
              "size",
              "thickness",
              "weight",
              "rulers",
              "mints",
              "tags",
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
          Issuer: expect.objectContaining({
            type: "object",
            properties: expect.objectContaining({
              name: {
                type: "string",
                minLength: 1,
                maxLength: 200,
                pattern: expect.any(String),
              },
              code: { type: "string", pattern: expect.any(String) },
            }),
            required: ["name", "code"],
            additionalProperties: false,
          }),
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
      expect(coinListItemSchema.properties).not.toHaveProperty("demonetized")
      expect(coinListItemSchema.properties).not.toHaveProperty("size")
      expect(coinListItemSchema.properties).not.toHaveProperty("thickness")
      expect(coinListItemSchema.properties).not.toHaveProperty("weight")
      expect(coinListItemSchema.properties).not.toHaveProperty("composition")
      expect(coinListItemSchema.properties).not.toHaveProperty(
        "compositionName"
      )
      expect(coinListItemSchema.properties).not.toHaveProperty(
        "compositionDetail"
      )
      expect(coinListItemSchema.properties).not.toHaveProperty("mints")
      expect(coinListItemSchema.properties).not.toHaveProperty("tags")
      expect(coinListItemSchema.properties).not.toHaveProperty("obverse")
      expect(coinListItemSchema.properties).not.toHaveProperty("reverse")
      expect(coinListItemSchema.properties).not.toHaveProperty("edge")
    })

    it("looks up a Coin Slug with the same detail as its UUID", async () => {
      const hamburg = {
        ...coin,
        slug: "hamburg-2008",
        issuer: { ...coin.issuer, slug: "germany" },
      }
      const app = createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => hamburg,
        findCoinBySlug: async (slug) =>
          slug === "hamburg-2008" ? hamburg : null,
        imageBaseUrl: "https://images.coin-archive.example",
      })
      const uuid = await app.request(`/v1/coins/${coinId}`)
      const bySlug = await app.request("/v1/coins/by-slug/hamburg-2008")
      expect(bySlug.status).toBe(200)
      expect(await bySlug.json()).toEqual(await uuid.json())
    })

    it("rejects malformed Coin Slugs and returns 404 for unknown ones", async () => {
      let calls = 0
      const app = createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinBySlug: async () => {
          calls++
          return null
        },
      })
      const malformed = await app.request("/v1/coins/by-slug/Bad-Slug")
      expect(malformed.status).toBe(400)
      expect(await malformed.json()).toEqual({
        error: { code: "invalid_coin_slug", message: "Coin Slug is invalid" },
      })
      expect(calls).toBe(0)
      const unknown = await app.request("/v1/coins/by-slug/unknown-coin")
      expect(unknown.status).toBe(404)
      expect(calls).toBe(1)
    })
  })
})
