import { count, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db, getCoins } from "../index"
import { catalogue } from "../schema/catalogue"
import { coinReference } from "../schema/coin-reference"
import { distribution } from "../schema/distribution"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { seedDatabase } from "./index"

type SeededCoinListing = Awaited<ReturnType<typeof getCoins>>
type SeededCoinListingItem = SeededCoinListing[number]

const findSeededCoinByTitle = (
  seededCoins: SeededCoinListing,
  title: string
): SeededCoinListingItem | undefined =>
  seededCoins.find((seededCoin) => seededCoin.title === title)

const expectSeededCoinMeasurements = (
  seededCoins: SeededCoinListing,
  title: string,
  measurements: SeededCoinListingItem["measurements"]
) => {
  expect(findSeededCoinByTitle(seededCoins, title)).toMatchObject({
    title,
    measurements,
  })
}

describe("seed integration", () => {
  useTestDatabaseIsolation(db)

  it("seeds the demo KM catalogue reference once and exposes it in coin listings", async () => {
    await seedDatabase()
    await seedDatabase()

    const [kmCatalogueCount] = await db
      .select({ count: count() })
      .from(catalogue)
      .where(eq(catalogue.code, "KM"))
    const [kmReferenceCount] = await db
      .select({ count: count() })
      .from(coinReference)
      .where(eq(coinReference.number, "1338A"))
    const [standardCirculationCount] = await db
      .select({ count: count() })
      .from(distribution)
      .where(eq(distribution.code, "standard-circulation"))
    const [circulatingCommemorativeCount] = await db
      .select({ count: count() })
      .from(distribution)
      .where(eq(distribution.code, "circulating-commemorative"))

    expect(kmCatalogueCount?.count).toBe(1)
    expect(kmReferenceCount?.count).toBe(1)
    expect(standardCirculationCount?.count).toBe(1)
    expect(circulatingCommemorativeCount?.count).toBe(1)

    const seededCoins = await getCoins({ limit: 10 })
    const seededCoin = findSeededCoinByTitle(
      seededCoins,
      "2014 Kennedy Half Dollar"
    )

    expect(seededCoin).toMatchObject({
      title: "2014 Kennedy Half Dollar",
      issueYearRange: {
        minYear: 2014,
        maxYear: 2026,
      },
      measurements: {
        weight: "11.34",
        diameter: "30.61",
        thickness: "2.15",
      },
      distribution: {
        code: "standard-circulation",
        name: "Standard circulation",
      },
      references: [
        {
          type: "catalogue",
          number: "1338A",
          catalogue: {
            code: "KM",
            title: "Standard Catalog of World Coins",
          },
        },
      ],
    })

    const earlyAmericanSeedCoin = findSeededCoinByTitle(
      seededCoins,
      "1793 Flowing Hair Cent"
    )

    expect(earlyAmericanSeedCoin).toMatchObject({
      title: "1793 Flowing Hair Cent",
      issueYearRange: {
        minYear: 1793,
        maxYear: 1793,
      },
      measurements: {
        weight: "13.48",
        diameter: "27.50",
        thickness: null,
      },
    })
  })

  it("seeds measurement demo coins with full and partial measurement coverage for homepage verification", async () => {
    await seedDatabase()

    const seededCoins = await getCoins({ limit: 20 })

    expectSeededCoinMeasurements(seededCoins, "2001 Argentine 1 Peso", {
      weight: "6.35",
      diameter: "23.00",
      thickness: "2.00",
    })
    expectSeededCoinMeasurements(seededCoins, "1896 Argentine 20 Centavos", {
      weight: null,
      diameter: "21.00",
      thickness: "1.40",
    })
    expectSeededCoinMeasurements(seededCoins, "1822 Buenos Aires Decimo", {
      weight: "1.35",
      diameter: null,
      thickness: "0.90",
    })
    expectSeededCoinMeasurements(seededCoins, "1793 Flowing Hair Cent", {
      weight: "13.48",
      diameter: "27.50",
      thickness: null,
    })
  })
})
