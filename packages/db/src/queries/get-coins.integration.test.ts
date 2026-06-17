import { describe, expect, it } from "vitest"
import { db, getCoins } from "../index"
import { createCoin, createIssuer } from "../testing/fixtures"
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
        id: expect.any(String),
        title: "Athenian Owl",
        issuer: {
          id: expect.any(String),
          code: "athens",
          isoCode: "GR",
          name: "Athens",
        },
      },
      {
        id: expect.any(String),
        title: "Spanish Euro",
        issuer: {
          id: expect.any(String),
          code: "spain",
          isoCode: "ES",
          name: "Spain",
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
})
