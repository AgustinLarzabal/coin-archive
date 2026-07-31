import { asc, count, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import {
  db,
  getCoin,
  getCoins,
  getIssuers,
  getCurrencies,
  getEngravers,
  getMints,
  getOrientations,
  getRims,
  getRulers,
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
import {
  seededCoinRulers,
  seededEngravers,
  seededIssuers,
  seededRulers,
} from "./seed-data"
import { seedDatabase } from "./index"

const expectedSeededCurrencies = [
  {
    code: "euro",
    name: "Euro",
    fullName: "Euro (2002-date)",
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
    code: "map",
    name: "Map",
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
    code: "circular",
    name: "Circular",
  },
] as const

const expectedSeededRims = [
  {
    code: "raised-not-decorated-both-sides",
    name: "Raised. Not decorated. Both sides",
  },
] as const

const expectedSeededTechniques = [
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
    const seededCurrencyOptions = await getCurrencies()

    expect(seededCurrencyOptions).toHaveLength(expectedSeededCurrencies.length)
    expect(seededCurrencyOptions).toEqual(
      expect.arrayContaining(
        expectedSeededCurrencies.map((record) =>
          expect.objectContaining(record)
        )
      )
    )
    const seededEngraverOptions = await getEngravers()

    expect(seededEngraverOptions).toHaveLength(seededEngravers.length)
    expect(seededEngraverOptions).toEqual(
      expect.arrayContaining(
        seededEngravers.map(({ code, name }) =>
          expect.objectContaining({ code, name })
        )
      )
    )
    const seededIssuerOptions = await getIssuers()

    expect(seededIssuerOptions).toHaveLength(seededIssuers.length)
    expect(seededIssuerOptions).toEqual(
      expect.arrayContaining(
        seededIssuers.map(({ code, isoCode, name }) =>
          expect.objectContaining({ code, isoCode, name })
        )
      )
    )
    await expectOptionsToIncludeExpectedRecords(getMints(), expectedSeededMints)
    await expectOptionsToIncludeExpectedRecords(
      getOrientations(),
      expectedSeededOrientations
    )
    const seededShapeOptions = await getShapes()

    expect(seededShapeOptions).toHaveLength(expectedSeededShapes.length)
    expect(seededShapeOptions).toEqual(
      expect.arrayContaining(
        expectedSeededShapes.map((record) => expect.objectContaining(record))
      )
    )
    const seededRimOptions = await getRims()

    expect(seededRimOptions).toHaveLength(expectedSeededRims.length)
    expect(seededRimOptions).toEqual(
      expect.arrayContaining(
        expectedSeededRims.map((record) => expect.objectContaining(record))
      )
    )
    const seededRulerOptions = await getRulers()

    expect(seededRulerOptions).toHaveLength(seededRulers.length)
    expect(seededRulerOptions).toEqual(
      expect.arrayContaining(
        seededRulers.map(({ code, name }) =>
          expect.objectContaining({ code, name })
        )
      )
    )
    const seededTechniqueOptions = await getTechniques()

    expect(seededTechniqueOptions).toHaveLength(expectedSeededTechniques.length)
    expect(seededTechniqueOptions).toEqual(
      expect.arrayContaining(
        expectedSeededTechniques.map((record) =>
          expect.objectContaining(record)
        )
      )
    )
    const seededThemeOptions = await getThemes()

    expect(seededThemeOptions).toHaveLength(expectedSeededThemes.length)
    expect(seededThemeOptions).toEqual(
      expect.arrayContaining(
        expectedSeededThemes.map((record) => expect.objectContaining(record))
      )
    )

    const seededCoins = await getCoins({ limit: 30 })

    expect(findCoinRecordByTitle(seededCoins, "Spain 2 Euro")).toMatchObject({
      id: expect.any(String),
      title: "Spain 2 Euro",
      issuer: {
        code: "spain",
        isoCode: "ES",
        name: "Spain",
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

    await expect(getCoin(spain2Euro.id)).resolves.toMatchObject({
      title: "Spain 2 Euro",
      rulers: [
        {
          code: "felipe-vi",
          name: "Felipe VI",
        },
      ],
    })
  })

  it("keeps seeded ruler filtering exact to direct attributions", async () => {
    await seedDatabase()

    const filteredCoins = await getCoins({
      rulerCode: "  FELIPE-VI  ",
      limit: 30,
    })

    expect(filteredCoins.map(({ title }) => title)).toEqual([
      "Spain 1 Euro",
      "Spain 2 Euro",
    ])
  })
})
