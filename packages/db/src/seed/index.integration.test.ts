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
      ({ title }) => title === "2014 Kennedy Half Dollar"
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

    const earlyAmericanSeedCoin = (await getCoins({ limit: 10 })).find(
      ({ title }) => title === "1793 Flowing Hair Cent"
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

    expect(
      seededCoins.find(({ title }) => title === "2001 Argentine 1 Peso")
    ).toMatchObject({
      title: "2001 Argentine 1 Peso",
      measurements: {
        weight: "6.35",
        diameter: "23.00",
        thickness: "2.00",
      },
    })

    expect(
      seededCoins.find(({ title }) => title === "1896 Argentine 20 Centavos")
    ).toMatchObject({
      title: "1896 Argentine 20 Centavos",
      measurements: {
        weight: null,
        diameter: "21.00",
        thickness: "1.40",
      },
    })

    expect(
      seededCoins.find(({ title }) => title === "1822 Buenos Aires Decimo")
    ).toMatchObject({
      title: "1822 Buenos Aires Decimo",
      measurements: {
        weight: "1.35",
        diameter: null,
        thickness: "0.90",
      },
    })

    expect(
      seededCoins.find(({ title }) => title === "1793 Flowing Hair Cent")
    ).toMatchObject({
      title: "1793 Flowing Hair Cent",
      measurements: {
        weight: "13.48",
        diameter: "27.50",
        thickness: null,
      },
    })
  })
})
