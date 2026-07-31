import { asc, count, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import {
  db,
  getCoin,
  getCoins,
  getIssuers,
  getCurrencies,
  getMints,
  getOrientations,
  getRims,
  getShapes,
  getTechniques,
  getThemes,
} from "../index"
import { catalogue } from "../schema/catalogue"
import { coinReference } from "../schema/coin-reference"
import { coinSurface } from "../schema/coin-surface"
import { coin } from "../schema/coin"
import { distribution } from "../schema/distribution"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { seededCoinRulers } from "./seed-data"
import { seedDatabase } from "./index"

const expectedSeededCurrencies = [
  {
    code: "argentine-peso",
    name: "Argentine peso",
    fullName: "Argentine peso",
  },
  {
    code: "euro",
    name: "Euro",
    fullName: "Euro (2002-date)",
  },
  {
    code: "real",
    name: "Real",
    fullName: "Real",
  },
  {
    code: "united-states-dollar",
    name: "United States dollar",
    fullName: "United States dollar",
  },
] as const

const expectedSeededMints = [
  {
    code: "buenos-aires-mint",
    name: "Buenos Aires Mint",
  },
  {
    code: "denver-mint",
    name: "Denver Mint",
  },
  {
    code: "philadelphia-mint",
    name: "Philadelphia Mint",
  },
  {
    code: "royal-mint-of-madrid",
    name: "Royal Mint of Madrid",
  },
] as const

const expectedSeededThemes = [
  {
    code: "animal",
    name: "Animal",
  },
  {
    code: "building",
    name: "Building",
  },
  {
    code: "flag",
    name: "Flag",
  },
  {
    code: "independence",
    name: "Independence",
  },
  {
    code: "map",
    name: "Map",
  },
  {
    code: "plant",
    name: "Plant",
  },
  {
    code: "portrait",
    name: "Portrait",
  },
] as const

const expectedSeededOrientations = [
  {
    code: "coin-alignment",
    name: "Coin alignment",
  },
  {
    code: "medal-alignment",
    name: "Medal alignment",
  },
] as const

const expectedSeededShapes = [
  {
    code: "round",
    name: "Round",
  },
  {
    code: "scalloped",
    name: "Scalloped",
  },
] as const

const expectedSeededRims = [
  {
    code: "lettered",
    name: "Lettered",
  },
  {
    code: "plain",
    name: "Plain",
  },
  {
    code: "raised-both-sides",
    name: "Raised, both sides",
  },
] as const

const expectedSeededTechniques = [
  {
    code: "cast",
    name: "Cast",
  },
  {
    code: "hammered",
    name: "Hammered",
  },
  {
    code: "milled",
    name: "Milled",
  },
] as const

const expectedSpain2EuroSurfaceRows = [
  {
    kind: "edge-surface",
    imageUrl: null,
  },
  {
    kind: "obverse",
    imageUrl: null,
  },
  {
    kind: "reverse",
    imageUrl: null,
  },
] as const

const expectedPublishedCoinWithoutRulerMessage =
  'Seed import rejected coin "Spain 2 Euro" because published Coins require at least one Ruler Attribution. Seed data is the current published Coin validation seam; low-level fixtures remain flexible.'

function removeSeededCoinRulersForCoinTitle(coinTitle: string) {
  const originalSeededCoinRulers = [...seededCoinRulers]
  const seededCoinRulersToKeep = originalSeededCoinRulers.filter(
    (seededCoinRuler) => seededCoinRuler.coinTitle !== coinTitle
  )
  const removedSeededCoinRulerCount =
    originalSeededCoinRulers.length - seededCoinRulersToKeep.length

  expect(removedSeededCoinRulerCount).toBeGreaterThan(0)

  seededCoinRulers.splice(0, seededCoinRulers.length, ...seededCoinRulersToKeep)

  return () => {
    seededCoinRulers.splice(
      0,
      seededCoinRulers.length,
      ...originalSeededCoinRulers
    )
  }
}

function findCoinRecordByTitle<
  TCoinRecord extends {
    title: string
  },
>(coinRecords: TCoinRecord[], title: string) {
  const coinRecord = coinRecords.find((record) => record.title === title)

  expect(
    coinRecord,
    `Expected seeded coin "${title}" in getCoins results`
  ).toBeDefined()

  if (coinRecord === undefined) {
    throw new Error(`Expected seeded coin "${title}" in getCoins results`)
  }

  return coinRecord
}

async function expectOptionsToIncludeExpectedRecords(
  recordsPromise: Promise<unknown[]>,
  expectedRecords: readonly Record<string, unknown>[]
) {
  await expect(recordsPromise).resolves.toEqual(
    expect.arrayContaining(
      expectedRecords.map((record) => expect.objectContaining(record))
    )
  )
}

describe("seed integration", () => {
  useTestDatabaseIsolation(db)

  it("seeds the demo Orientation values and assignments alongside the existing catalogue examples once and exposes them in coin listings", async () => {
    await seedDatabase()
    await seedDatabase()

    const kmCatalogueCount = (
      await db
        .select({ count: count() })
        .from(catalogue)
        .where(eq(catalogue.code, "KM"))
    ).at(0)
    const kmReferenceCount = (
      await db
        .select({ count: count() })
        .from(coinReference)
        .where(eq(coinReference.number, "1338A"))
    ).at(0)
    const standardCirculationCount = (
      await db
        .select({ count: count() })
        .from(distribution)
        .where(eq(distribution.code, "standard-circulation"))
    ).at(0)
    const circulatingCommemorativeCount = (
      await db
        .select({ count: count() })
        .from(distribution)
        .where(eq(distribution.code, "circulating-commemorative"))
    ).at(0)

    expect(kmCatalogueCount?.count).toBe(1)
    expect(kmReferenceCount?.count).toBe(1)
    expect(standardCirculationCount?.count).toBe(1)
    expect(circulatingCommemorativeCount?.count).toBe(1)
    await expectOptionsToIncludeExpectedRecords(
      getCurrencies(),
      expectedSeededCurrencies
    )
    await expect(getIssuers()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "argentina",
          isoCode: "AR",
          name: "Argentina",
        }),
        expect.objectContaining({
          code: "buenos-aires",
          isoCode: "AR",
          name: "Buenos Aires",
        }),
        expect.objectContaining({
          code: "finland",
          isoCode: "FI",
          name: "Finland",
        }),
        expect.objectContaining({
          code: "spain",
          isoCode: "ES",
          name: "Spain",
        }),
        expect.objectContaining({
          code: "united-states",
          isoCode: "US",
          name: "United States of America",
        }),
      ])
    )
    await expectOptionsToIncludeExpectedRecords(getMints(), expectedSeededMints)
    await expectOptionsToIncludeExpectedRecords(
      getOrientations(),
      expectedSeededOrientations
    )
    await expectOptionsToIncludeExpectedRecords(
      getShapes(),
      expectedSeededShapes
    )
    await expectOptionsToIncludeExpectedRecords(getRims(), expectedSeededRims)
    await expectOptionsToIncludeExpectedRecords(
      getTechniques(),
      expectedSeededTechniques
    )
    await expectOptionsToIncludeExpectedRecords(
      getThemes(),
      expectedSeededThemes
    )

    const seededCoins = await getCoins({ limit: 30 })

    expect(
      findCoinRecordByTitle(seededCoins, "United States National Park Quarter")
    ).toMatchObject({
      id: expect.any(String),
      title: "United States National Park Quarter",
      issuer: {
        code: "united-states",
        isoCode: "US",
        name: "United States of America",
      },
    })

    expect(
      findCoinRecordByTitle(seededCoins, "Buenos Aires Transition Half Real")
    ).toMatchObject({
      id: expect.any(String),
      title: "Buenos Aires Transition Half Real",
      issuer: {
        code: "buenos-aires",
        isoCode: "AR",
        name: "Buenos Aires",
      },
    })

    expect(
      findCoinRecordByTitle(seededCoins, "Argentina Copper Peso")
    ).toMatchObject({
      id: expect.any(String),
      title: "Argentina Copper Peso",
      issuer: {
        code: "argentina",
        isoCode: "AR",
        name: "Argentina",
      },
    })

    expect(findCoinRecordByTitle(seededCoins, "Spain 2 Euro")).toMatchObject({
      id: expect.any(String),
      title: "Spain 2 Euro",
      issuer: {
        code: "spain",
        isoCode: "ES",
        name: "Spain",
      },
    })

    expect(
      findCoinRecordByTitle(seededCoins, "Buenos Aires 8 Reales 1813")
    ).toMatchObject({
      id: expect.any(String),
      title: "Buenos Aires 8 Reales 1813",
      issuer: {
        code: "buenos-aires",
        isoCode: "AR",
        name: "Buenos Aires",
      },
    })

    expect(
      findCoinRecordByTitle(seededCoins, "United States Lincoln Cent")
    ).toMatchObject({
      id: expect.any(String),
      title: "United States Lincoln Cent",
      issuer: {
        code: "united-states",
        isoCode: "US",
        name: "United States of America",
      },
    })

    expect(
      findCoinRecordByTitle(seededCoins, "Argentina Convertible Peso")
    ).toMatchObject({
      id: expect.any(String),
      title: "Argentina Convertible Peso",
      issuer: {
        code: "argentina",
        isoCode: "AR",
        name: "Argentina",
      },
    })
  })

  it("seeds the Spain 2 Euro surface image URL combinations", async () => {
    await seedDatabase()

    const seededSpain2EuroSurfaceRows = await db
      .select({
        kind: coinSurface.kind,
        imageUrl: coinSurface.imageUrl,
      })
      .from(coinSurface)
      .innerJoin(coin, eq(coin.id, coinSurface.coinId))
      .where(eq(coin.title, "Spain 2 Euro"))
      .orderBy(asc(coinSurface.kind))

    expect(seededSpain2EuroSurfaceRows).toEqual(expectedSpain2EuroSurfaceRows)
  })

  it("rejects published seed data without a ruler attribution while leaving low-level fixtures outside that seam", async () => {
    const restoreSeededCoinRulers =
      removeSeededCoinRulersForCoinTitle("Spain 2 Euro")

    try {
      await expect(seedDatabase()).rejects.toThrow(
        expectedPublishedCoinWithoutRulerMessage
      )
    } finally {
      restoreSeededCoinRulers()
    }
  })

  it("exposes seeded coin ruler attributions through direct catalogue reads", async () => {
    await seedDatabase()

    const seededCoins = await getCoins({ limit: 30 })
    const spain2Euro = findCoinRecordByTitle(seededCoins, "Spain 2 Euro")
    const buenosAiresCoin = findCoinRecordByTitle(
      seededCoins,
      "Buenos Aires 8 Reales 1813"
    )

    await expect(getCoin(spain2Euro.id)).resolves.toMatchObject({
      title: "Spain 2 Euro",
      rulers: [
        {
          code: "felipe-vi",
          name: "Felipe VI",
        },
      ],
    })
    await expect(getCoin(buenosAiresCoin.id)).resolves.toMatchObject({
      title: "Buenos Aires 8 Reales 1813",
      rulers: [
        {
          code: "province-of-buenos-aires",
          name: "Province of Buenos Aires",
        },
      ],
    })
  })

  it("keeps seeded ruler filtering exact to direct attributions", async () => {
    await seedDatabase()

    const filteredCoins = await getCoins({
      rulerCode: "  ARGENTINE-REPUBLIC  ",
      limit: 30,
    })

    expect(filteredCoins.map(({ title }) => title)).toEqual([
      "Argentina 2 Pesos",
      "Argentina 50 Centavos",
      "Argentina 10 Centavos",
      "Argentina Convertible Peso",
      "Argentina Copper Peso",
      "Argentina 20 Centavos",
      "Argentina Sol de Mayo Peso",
    ])
  })
})
