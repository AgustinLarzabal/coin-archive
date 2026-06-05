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

    const seededCoin = (await getCoins({ limit: 10 })).find(
      ({ title }) => title === "Seed Coin 06"
    )

    expect(seededCoin).toMatchObject({
      title: "Seed Coin 06",
      issueYearRange: {
        minYear: 2014,
        maxYear: 2026,
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
      ({ title }) => title === "Seed Coin 08"
    )

    expect(ancientSeedCoin).toMatchObject({
      title: "Seed Coin 08",
      issueYearRange: {
        minYear: -2,
        maxYear: 0,
      },
    })
  })
})
