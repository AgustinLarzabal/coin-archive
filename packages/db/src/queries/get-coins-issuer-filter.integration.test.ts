import { describe, expect, it } from "vitest"
import { buildGetCoinsQuery } from "./get-coins"
import type { GetCoinsOptions } from "./get-coins"
import { mapGetCoinsRowsToCoinRecords } from "./map-get-coins-row"
import { db } from "../index"
import { createCoin, createIssuer } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

const selectedIssuerCode = "ancient-greece"
const unrelatedIssuerCode = "sparta"

const issuerFixture = {
  parent: {
    code: selectedIssuerCode,
    name: "Ancient Greece",
  },
  child: {
    code: "athens",
    name: "Athens",
  },
  grandchild: {
    code: "athens-classical",
    name: "Athens Classical",
  },
  unrelated: {
    code: unrelatedIssuerCode,
    name: "Sparta",
  },
} as const

const issuerFilterFixtureCoins = [
  {
    issuer: "parent",
    title: "Greek Union Coin",
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
  },
  {
    issuer: "child",
    title: "Athenian Owl",
    createdAt: new Date("2026-03-02T00:00:00.000Z"),
  },
  {
    issuer: "grandchild",
    title: "Classical Athena",
    createdAt: new Date("2026-03-03T00:00:00.000Z"),
  },
  {
    issuer: "unrelated",
    title: "Spartan Shield",
    createdAt: new Date("2026-03-04T00:00:00.000Z"),
  },
] as const

describe("getCoins issuer filter integration", () => {
  useTestDatabaseIsolation(db)

  async function getCoins(options: GetCoinsOptions = {}) {
    const rows = await buildGetCoinsQuery(db, options)

    return mapGetCoinsRowsToCoinRecords(rows)
  }

  async function createIssuerFilterFixture() {
    const parentIssuer = await createIssuer(issuerFixture.parent)
    const childIssuer = await createIssuer({
      ...issuerFixture.child,
      parentIssuerId: parentIssuer.id,
    })
    const grandchildIssuer = await createIssuer({
      ...issuerFixture.grandchild,
      parentIssuerId: childIssuer.id,
    })
    const unrelatedIssuer = await createIssuer(issuerFixture.unrelated)

    const issuerIds = {
      parent: parentIssuer.id,
      child: childIssuer.id,
      grandchild: grandchildIssuer.id,
      unrelated: unrelatedIssuer.id,
    } as const

    for (const fixtureCoin of issuerFilterFixtureCoins) {
      await createCoin({
        title: fixtureCoin.title,
        issuerId: issuerIds[fixtureCoin.issuer],
        createdAt: fixtureCoin.createdAt,
      })
    }
  }

  async function getCoinsForSelectedIssuer() {
    return getCoins({
      issuerCode: selectedIssuerCode,
    })
  }

  async function getCoinSummaries(options: GetCoinsOptions = {}) {
    return mapCoinSummaries(await getCoins(options))
  }

  function mapCoinSummaries(coins: Awaited<ReturnType<typeof getCoins>>) {
    return coins.map(({ title, issuer }) => ({
      title,
      issuerCode: issuer.code,
    }))
  }

  it("returns coins linked directly to the selected issuer", async () => {
    await createIssuerFilterFixture()

    await expect(getCoinsForSelectedIssuer()).resolves.toContainEqual(
      expect.objectContaining({
        title: "Greek Union Coin",
        issuer: expect.objectContaining({
          code: selectedIssuerCode,
        }),
      })
    )
  })

  it("returns coins linked to descendant issuers of the selected issuer", async () => {
    await createIssuerFilterFixture()

    await expect(getCoinsForSelectedIssuer()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Athenian Owl",
          issuer: expect.objectContaining({
            code: issuerFixture.child.code,
          }),
        }),
        expect.objectContaining({
          title: "Classical Athena",
          issuer: expect.objectContaining({
            code: issuerFixture.grandchild.code,
          }),
        }),
      ])
    )
  })

  it("excludes unrelated issuers from filtered results", async () => {
    await createIssuerFilterFixture()

    const filteredCoins = await getCoinsForSelectedIssuer()

    expect(
      filteredCoins.find(({ issuer }) => issuer.code === unrelatedIssuerCode)
    ).toBeUndefined()
    expect(mapCoinSummaries(filteredCoins)).toStrictEqual([
      {
        title: "Classical Athena",
        issuerCode: issuerFixture.grandchild.code,
      },
      {
        title: "Athenian Owl",
        issuerCode: issuerFixture.child.code,
      },
      {
        title: "Greek Union Coin",
        issuerCode: selectedIssuerCode,
      },
    ])
  })

  it("matches issuer codes case-insensitively", async () => {
    await createIssuerFilterFixture()

    await expect(
      getCoinSummaries({
        issuerCode: "ANCIENT-GREECE",
      })
    ).resolves.toStrictEqual(
      await getCoinSummaries({ issuerCode: "ancient-greece" })
    )
  })

  it("ignores surrounding whitespace in issuer codes", async () => {
    await createIssuerFilterFixture()

    await expect(
      getCoinSummaries({
        issuerCode: "  ancient-greece  ",
      })
    ).resolves.toStrictEqual(
      await getCoinSummaries({ issuerCode: "ancient-greece" })
    )
  })

  it("does not apply an issuer filter for empty issuer codes", async () => {
    await createIssuerFilterFixture()

    await expect(
      getCoinSummaries({
        issuerCode: "",
      })
    ).resolves.toStrictEqual([
      {
        title: "Spartan Shield",
        issuerCode: issuerFixture.unrelated.code,
      },
      {
        title: "Classical Athena",
        issuerCode: issuerFixture.grandchild.code,
      },
      {
        title: "Athenian Owl",
        issuerCode: issuerFixture.child.code,
      },
      {
        title: "Greek Union Coin",
        issuerCode: selectedIssuerCode,
      },
    ])
  })

  it("returns an empty list for an unknown issuer code without falling back to unfiltered results", async () => {
    const carthage = await createIssuer({
      code: "carthage",
      name: "Carthage",
    })

    await createCoin({
      title: "Punic Bronze",
      issuerId: carthage.id,
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
    })

    await expect(getCoins()).resolves.toHaveLength(1)
    await expect(
      getCoins({
        issuerCode: "unknown-issuer",
      })
    ).resolves.toStrictEqual([])
  })
})
