import { count, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import {
  db,
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
import { distribution } from "../schema/distribution"
import { useTestDatabaseIsolation } from "../testing/test-database"
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
    await expect(getCurrencies()).resolves.toMatchObject(expectedSeededCurrencies)
    await expect(getIssuers()).resolves.toMatchObject([
      { code: "argentina", isoCode: "AR", name: "Argentina" },
      { code: "buenos-aires", isoCode: "AR", name: "Buenos Aires" },
      {
        code: "united-states",
        isoCode: "US",
        name: "United States of America",
      },
      { code: "spain", isoCode: "ES", name: "Spain" },
    ])
    await expect(getMints()).resolves.toMatchObject(expectedSeededMints)
    await expect(getOrientations()).resolves.toMatchObject(expectedSeededOrientations)
    await expect(getShapes()).resolves.toMatchObject(expectedSeededShapes)
    await expect(getRims()).resolves.toMatchObject(expectedSeededRims)
    await expect(getTechniques()).resolves.toMatchObject(expectedSeededTechniques)
    await expect(getThemes()).resolves.toMatchObject(expectedSeededThemes)

    const seededCoins = await getCoins({ limit: 20 })
    const findSeededCoin = (title: string) => {
      const seededCoin = seededCoins.find((coinRecord) => coinRecord.title === title)

      expect(seededCoin, `Expected seeded coin "${title}" in getCoins results`).toBeDefined()

      return seededCoin
    }

    expect(findSeededCoin("United States National Park Quarter")).toMatchObject({
      title: "United States National Park Quarter",
      issuer: {
        code: "united-states",
        isoCode: "US",
        name: "United States of America",
      },
      mints: [
        {
          code: "denver-mint",
          name: "Denver Mint",
        },
        {
          code: "philadelphia-mint",
          name: "Philadelphia Mint",
        },
      ],
      themes: [
        {
          code: "animal",
          name: "Animal",
        },
        {
          code: "plant",
          name: "Plant",
        },
      ],
      issueYearRange: {
        minYear: 2014,
        maxYear: 2026,
      },
      shape: {
        code: "round",
        name: "Round",
      },
      rim: {
        code: "raised-both-sides",
        name: "Raised, both sides",
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
      orientation: {
        code: "coin-alignment",
        name: "Coin alignment",
      },
      technique: {
        code: "milled",
        name: "Milled",
      },
      distribution: {
        code: "standard-circulation",
        name: "Standard circulation",
      },
    })

    expect(findSeededCoin("Buenos Aires Transition Half Real")).toMatchObject({
      title: "Buenos Aires Transition Half Real",
      issuer: {
        code: "buenos-aires",
        isoCode: "AR",
        name: "Buenos Aires",
        parent: {
          code: "argentina",
          isoCode: "AR",
          name: "Argentina",
        },
      },
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

    expect(findSeededCoin("Argentina Copper Peso")).toMatchObject({
      title: "Argentina Copper Peso",
      comments: null,
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

    expect(findSeededCoin("Spain 2 Euro")).toMatchObject({
      title: "Spain 2 Euro",
      comments:
        "Common circulating commemorative format with a national obverse and shared euro reverse.",
      edge: {
        code: "lettered",
        name: "Lettered",
        description: "Finely reeded with incuse lettering.",
        lettering: "2 **",
      },
      mints: [
        {
          code: "royal-mint-of-madrid",
          name: "Royal Mint of Madrid",
        },
      ],
      themes: [
        {
          code: "building",
          name: "Building",
        },
        {
          code: "map",
          name: "Map",
        },
      ],
      faceValue: {
        text: "2 Euros",
        numericValue: 2,
        currency: {
          code: "euro",
          name: "Euro",
          fullName: "Euro (2002-date)",
        },
      },
      orientation: {
        code: "medal-alignment",
        name: "Medal alignment",
      },
      technique: {
        code: "milled",
        name: "Milled",
      },
      obverse: {
        description: "Portrait of Felipe VI facing left.",
        lettering: "FELIPE VI REY DE ESPANA",
        engravers: [],
      },
      reverse: {
        description: "Map of Europe with denomination.",
        lettering: "2 EURO",
        engravers: [
          {
            code: "georgios-stamatopoulos",
            name: "Georgios Stamatópoulos",
          },
        ],
      },
      issueYearRange: {
        minYear: 2002,
        maxYear: 2026,
      },
      distribution: {
        code: "circulating-commemorative",
        name: "Circulating commemorative",
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
      rulers: [
        {
          code: "felipe-vi",
          name: "Felipe VI",
          group: {
            code: "house-of-bourbon",
            name: "House of Bourbon",
          },
        },
      ],
    })

    expect(findSeededCoin("Buenos Aires 8 Reales 1813")).toMatchObject({
      mints: [
        {
          code: "buenos-aires-mint",
          name: "Buenos Aires Mint",
        },
      ],
    })

    expect(findSeededCoin("United States Lincoln Cent")).toMatchObject({
      mints: [
        {
          code: "philadelphia-mint",
          name: "Philadelphia Mint",
        },
      ],
    })

    expect(findSeededCoin("Argentina Copper Peso")).toMatchObject({
      orientation: null,
      technique: null,
      themes: [],
      mints: [],
    })

    expect(findSeededCoin("Argentina Convertible Peso")).toMatchObject({
      comments: null,
      technique: {
        code: "milled",
        name: "Milled",
      },
    })
  })
})
