import { describe, expect, it } from "vitest"
import { buildGetCoinsQuery, type GetCoinsOptions } from "./get-coins"
import { mapGetCoinsRowToCoinRecord } from "./map-get-coins-row"
import { createCoin, createIssuer } from "../testing/fixtures"
import { useTestDatabase } from "../testing/test-database"

describe("getCoins issuer filter integration", () => {
  const testDb = useTestDatabase()

  async function getCoins(options: GetCoinsOptions = {}) {
    const rows = await buildGetCoinsQuery(testDb, options)

    return rows.map(mapGetCoinsRowToCoinRecord)
  }

  async function createIssuerFilterFixture() {
    const parentIssuer = await createIssuer({
      database: testDb,
      input: {
        code: "ancient-greece",
        name: "Ancient Greece",
      },
    })
    const childIssuer = await createIssuer({
      database: testDb,
      input: {
        code: "athens",
        name: "Athens",
        parentIssuerId: parentIssuer.id,
      },
    })
    const grandchildIssuer = await createIssuer({
      database: testDb,
      input: {
        code: "athens-classical",
        name: "Athens Classical",
        parentIssuerId: childIssuer.id,
      },
    })
    const unrelatedIssuer = await createIssuer({
      database: testDb,
      input: {
        code: "sparta",
        name: "Sparta",
      },
    })

    await createCoin({
      database: testDb,
      input: {
        title: "Greek Union Coin",
        issuerId: parentIssuer.id,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
      },
    })
    await createCoin({
      database: testDb,
      input: {
        title: "Athenian Owl",
        issuerId: childIssuer.id,
        createdAt: new Date("2026-03-02T00:00:00.000Z"),
      },
    })
    await createCoin({
      database: testDb,
      input: {
        title: "Classical Athena",
        issuerId: grandchildIssuer.id,
        createdAt: new Date("2026-03-03T00:00:00.000Z"),
      },
    })
    await createCoin({
      database: testDb,
      input: {
        title: "Spartan Shield",
        issuerId: unrelatedIssuer.id,
        createdAt: new Date("2026-03-04T00:00:00.000Z"),
      },
    })
  }

  it("returns coins linked directly to the selected issuer", async () => {
    await createIssuerFilterFixture()

    await expect(
      getCoins({
        issuerCode: "ancient-greece",
      })
    ).resolves.toContainEqual(
      expect.objectContaining({
        title: "Greek Union Coin",
        issuer: expect.objectContaining({
          code: "ancient-greece",
        }),
      })
    )
  })

  it("returns coins linked to descendant issuers of the selected issuer", async () => {
    await createIssuerFilterFixture()

    await expect(
      getCoins({
        issuerCode: "ancient-greece",
      })
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Athenian Owl",
          issuer: expect.objectContaining({
            code: "athens",
          }),
        }),
        expect.objectContaining({
          title: "Classical Athena",
          issuer: expect.objectContaining({
            code: "athens-classical",
          }),
        }),
      ])
    )
  })

  it("excludes unrelated issuers from filtered results", async () => {
    await createIssuerFilterFixture()

    const filteredCoins = await getCoins({
      issuerCode: "ancient-greece",
    })

    expect(
      filteredCoins.find(({ issuer }) => issuer.code === "sparta")
    ).toBeUndefined()
    expect(
      filteredCoins.map(({ title, issuer }) => ({
        title,
        issuerCode: issuer.code,
      }))
    ).toStrictEqual([
      {
        title: "Classical Athena",
        issuerCode: "athens-classical",
      },
      {
        title: "Athenian Owl",
        issuerCode: "athens",
      },
      {
        title: "Greek Union Coin",
        issuerCode: "ancient-greece",
      },
    ])
  })

  it("returns an empty list for an unknown issuer code without falling back to unfiltered results", async () => {
    const carthage = await createIssuer({
      database: testDb,
      input: {
        code: "carthage",
        name: "Carthage",
      },
    })

    await createCoin({
      database: testDb,
      input: {
        title: "Punic Bronze",
        issuerId: carthage.id,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    })

    await expect(getCoins()).resolves.toHaveLength(1)
    await expect(
      getCoins({
        issuerCode: "unknown-issuer",
      })
    ).resolves.toStrictEqual([])
  })
})
