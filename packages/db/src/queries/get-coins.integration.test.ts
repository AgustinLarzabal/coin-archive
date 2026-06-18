import { describe, expect, it } from "vitest"
import { db, getCoins } from "../index"
import {
  createCoin,
  createCoinSurface,
  createCoinSurfaceEngraver,
  createDistribution,
  createEngraver,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getCoins integration", () => {
  useTestDatabaseIsolation(db)

  it("returns recent coins newest first", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })

    await createCoin({
      title: "Earlier Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    await createCoin({
      title: "Latest Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
    })
    await createCoin({
      title: "Middle Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
    })

    await expect(getCoins()).resolves.toMatchObject([
      { title: "Latest Owl" },
      { title: "Middle Owl" },
      { title: "Earlier Owl" },
    ])
  })

  it("returns issuer data on direct results", async () => {
    const ancientWorld = await createIssuer({
      code: "ancient-world",
      isoCode: "XZ",
      name: "Ancient World",
    })
    const athens = await createIssuer({
      code: "athens",
      isoCode: "GR",
      name: "Athens",
      parentIssuerId: ancientWorld.id,
    })
    const spain = await createIssuer({
      code: "spain",
      isoCode: "ES",
      name: "Spain",
    })

    await createCoin({
      title: "Athenian Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-03-02T00:00:00.000Z"),
    })
    await createCoin({
      title: "Spanish Euro",
      issuerId: spain.id,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
    })

    await expect(getCoins({ limit: 2 })).resolves.toMatchObject([
      {
        title: "Athenian Owl",
        issuer: {
          code: "athens",
          isoCode: "GR",
          name: "Athens",
        },
        surfaces: {
          obverse: null,
          reverse: null,
          edge: null,
        },
      },
      {
        title: "Spanish Euro",
        issuer: {
          code: "spain",
          isoCode: "ES",
          name: "Spain",
        },
        surfaces: {
          obverse: null,
          reverse: null,
          edge: null,
        },
      },
    ])
  })

  it("returns grouped surfaces and face engravers without breaking coin limits", async () => {
    const spain = await createIssuer({
      code: "spain",
      isoCode: "ES",
      name: "Spain",
    })
    const portugal = await createIssuer({
      code: "portugal",
      isoCode: "PT",
      name: "Portugal",
    })

    const detailedCoin = await createCoin({
      title: "Detailed Spain Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-06-03T00:00:00.000Z"),
    })
    await createCoin({
      title: "Plain Portugal Coin",
      issuerId: portugal.id,
      createdAt: new Date("2026-06-02T00:00:00.000Z"),
    })
    await createCoin({
      title: "Older Spain Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
    })

    const obverseSurface = await createCoinSurface({
      coinId: detailedCoin.id,
      kind: "obverse",
      description: "Portrait facing left.",
      lettering: "DETAIL TEST",
      thumbnailUrl: "https://example.com/coins/detail-test/obverse-thumb",
      imageUrl: "https://example.com/coins/detail-test/obverse-image",
    })
    await createCoinSurface({
      coinId: detailedCoin.id,
      kind: "edge-surface",
      description: "Reeded edge with stars.",
      lettering: null,
      thumbnailUrl: "https://example.com/coins/detail-test/edge-thumb",
      imageUrl: "https://example.com/coins/detail-test/edge-image",
    })
    const firstEngraver = await createEngraver({
      code: "ana-ruiz",
      name: "Ana Ruiz",
    })
    const secondEngraver = await createEngraver({
      code: "beatriz-lopez",
      name: "Beatriz Lopez",
    })
    await createCoinSurfaceEngraver({
      coinSurfaceId: obverseSurface.id,
      engraverId: firstEngraver.id,
    })
    await createCoinSurfaceEngraver({
      coinSurfaceId: obverseSurface.id,
      engraverId: secondEngraver.id,
    })

    await expect(getCoins({ limit: 2 })).resolves.toMatchObject([
      {
        title: "Detailed Spain Coin",
        surfaces: {
          obverse: {
            description: "Portrait facing left.",
            lettering: "DETAIL TEST",
            thumbnailUrl: "https://example.com/coins/detail-test/obverse-thumb",
            imageUrl: "https://example.com/coins/detail-test/obverse-image",
            engravers: [
              {
                code: "ana-ruiz",
                name: "Ana Ruiz",
              },
              {
                code: "beatriz-lopez",
                name: "Beatriz Lopez",
              },
            ],
          },
          reverse: null,
          edge: {
            description: "Reeded edge with stars.",
            lettering: null,
            thumbnailUrl: "https://example.com/coins/detail-test/edge-thumb",
            imageUrl: "https://example.com/coins/detail-test/edge-image",
          },
        },
      },
      {
        title: "Plain Portugal Coin",
        surfaces: {
          obverse: null,
          reverse: null,
          edge: null,
        },
      },
    ])
  })

  it("filters by issuer code across the issuer tree", async () => {
    const iberia = await createIssuer({
      code: "iberia",
      name: "Iberia",
    })
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
      parentIssuerId: iberia.id,
    })
    const portugal = await createIssuer({
      code: "portugal",
      name: "Portugal",
      parentIssuerId: iberia.id,
    })
    const greece = await createIssuer({
      code: "greece",
      name: "Greece",
    })

    await createCoin({
      title: "Spanish Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-04-03T00:00:00.000Z"),
    })
    await createCoin({
      title: "Portuguese Coin",
      issuerId: portugal.id,
      createdAt: new Date("2026-04-02T00:00:00.000Z"),
    })
    await createCoin({
      title: "Greek Coin",
      issuerId: greece.id,
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
    })

    await expect(getCoins({ issuerCode: "  IBERIA  " })).resolves.toMatchObject(
      [{ title: "Spanish Coin" }, { title: "Portuguese Coin" }]
    )
  })

  it("ignores blank issuer filters", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })

    await createCoin({
      title: "Modern Spain",
      issuerId: spain.id,
      createdAt: new Date("2026-06-03T00:00:00.000Z"),
    })

    await expect(getCoins({ issuerCode: "   ", limit: 10 })).resolves.toMatchObject(
      [{ title: "Modern Spain" }]
    )
  })

  it("filters by distribution code case-insensitively", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const circulatingCommemorative = await createDistribution({
      code: "circulating-commemorative",
      name: "Circulating commemorative",
    })

    await createCoin({
      title: "Standard 1 Euro",
      issuerId: spain.id,
      distributionId: standardCirculation.id,
      createdAt: new Date("2026-06-03T00:00:00.000Z"),
    })
    await createCoin({
      title: "Commemorative 2 Euro",
      issuerId: spain.id,
      distributionId: circulatingCommemorative.id,
      createdAt: new Date("2026-06-02T00:00:00.000Z"),
    })

    await expect(
      getCoins({ distributionCode: "  STANDARD-CIRCULATION  ", limit: 10 })
    ).resolves.toMatchObject([{ title: "Standard 1 Euro" }])
  })

  it("ignores blank distribution filters", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })

    await createCoin({
      title: "Modern Spain",
      issuerId: spain.id,
      createdAt: new Date("2026-06-03T00:00:00.000Z"),
    })

    await expect(
      getCoins({ distributionCode: "   ", limit: 10 })
    ).resolves.toMatchObject([{ title: "Modern Spain" }])
  })

  it("filters by engraver code across obverse and reverse attributions", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const targetEngraver = await createEngraver({
      code: "luc-luycx",
      name: "Luc Luycx",
    })
    const otherEngraver = await createEngraver({
      code: "john-doe",
      name: "John Doe",
    })

    const obverseCoin = await createCoin({
      title: "Obverse Match",
      issuerId: spain.id,
      createdAt: new Date("2026-06-03T00:00:00.000Z"),
    })
    const reverseCoin = await createCoin({
      title: "Reverse Match",
      issuerId: spain.id,
      createdAt: new Date("2026-06-02T00:00:00.000Z"),
    })
    const unmatchedCoin = await createCoin({
      title: "Other Engraver",
      issuerId: spain.id,
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
    })

    const obverseSurface = await createCoinSurface({
      coinId: obverseCoin.id,
      kind: "obverse",
    })
    const reverseSurface = await createCoinSurface({
      coinId: reverseCoin.id,
      kind: "reverse",
    })
    const unmatchedSurface = await createCoinSurface({
      coinId: unmatchedCoin.id,
      kind: "obverse",
    })

    await createCoinSurfaceEngraver({
      coinSurfaceId: obverseSurface.id,
      engraverId: targetEngraver.id,
    })
    await createCoinSurfaceEngraver({
      coinSurfaceId: reverseSurface.id,
      engraverId: targetEngraver.id,
    })
    await createCoinSurfaceEngraver({
      coinSurfaceId: unmatchedSurface.id,
      engraverId: otherEngraver.id,
    })

    await expect(
      getCoins({ engraverCode: "  LUC-LUYCX  ", limit: 10 })
    ).resolves.toMatchObject([
      { title: "Obverse Match" },
      { title: "Reverse Match" },
    ])
  })
})
