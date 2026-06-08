import { count, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db, getCoins } from "../index"
import { catalogue } from "../schema/catalogue"
import { coinReference } from "../schema/coin-reference"
import { distribution } from "../schema/distribution"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { seedDatabase } from "./index"

describe("seed integration", () => {
  useTestDatabaseIsolation(db)

  it("seeds the demo KM catalogue reference, Euro face value example, and measurement-bearing coins once and exposes them in coin listings", async () => {
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

    const seededCoin = (await getCoins({ limit: 10 })).find(
      ({ title }) => title === "United States National Park Quarter"
    )

    expect(seededCoin).toMatchObject({
      title: "United States National Park Quarter",
      issueYearRange: {
        minYear: 2014,
        maxYear: 2026,
      },
      composition: {
        code: "copper-nickel-clad",
        name: "Copper-nickel clad",
        description: "Copper core with copper-nickel outer layers.",
      },
      measurements: {
        weight: 8.1,
        diameter: 26.5,
        thickness: 2,
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

    const ancientSeedCoin = (await getCoins({ limit: 10 })).find(
      ({ title }) => title === "Buenos Aires Transition Half Real"
    )

    expect(ancientSeedCoin).toMatchObject({
      title: "Buenos Aires Transition Half Real",
      composition: {
        code: "silver-900",
        name: "Silver (.900)",
      },
      issueYearRange: {
        minYear: -2,
        maxYear: 0,
      },
      measurements: {
        weight: 3.8,
        diameter: 18.5,
        thickness: 1.4,
      },
    })

    const partialMeasurementSeedCoin = (await getCoins({ limit: 10 })).find(
      ({ title }) => title === "Argentina Copper Peso"
    )

    expect(partialMeasurementSeedCoin).toMatchObject({
      title: "Argentina Copper Peso",
      composition: {
        code: "copper",
        name: "Copper",
        description: null,
      },
      measurements: {
        weight: null,
        diameter: 22,
        thickness: null,
      },
    })

    const euroSeedCoin = (await getCoins({ limit: 20 })).find(
      ({ title }) => title === "Spain 2 Euro"
    )

    expect(euroSeedCoin).toMatchObject({
      title: "Spain 2 Euro",
      faceValue: {
        text: "2 Euros",
        numericValue: 2,
        currency: {
          code: "euro",
          name: "Euro",
          fullName: "Euro (2002-date)",
        },
      },
      issueYearRange: {
        minYear: 2002,
        maxYear: 2026,
      },
      distribution: {
        code: "circulating-commemorative",
        name: "Circulating commemorative",
      },
    })
  })
})
