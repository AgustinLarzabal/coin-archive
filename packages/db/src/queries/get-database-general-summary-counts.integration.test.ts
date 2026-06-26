import { describe, expect, it } from "vitest"

import { db, getDatabaseGeneralSummaryCounts } from "../index"
import {
  createCatalogue,
  createComposition,
  createCurrency,
  createDistribution,
  createEngraver,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getDatabaseGeneralSummaryCounts integration", () => {
  useTestDatabaseIsolation(db)

  it("returns numeric counts for all maintained record types, including unused records", async () => {
    await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })
    await createComposition({
      code: "silver-900",
      name: "Silver .900",
    })
    await createCurrency({
      code: "argentine-peso",
      name: "Peso",
      fullName: "Argentine peso",
    })
    await createCurrency({
      code: "united-states-dollar",
      name: "Dollar",
      fullName: "United States dollar",
    })
    await createCurrency({
      code: "euro",
      name: "Euro",
      fullName: "Euro",
    })
    await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    await createEngraver({
      code: "barth",
      name: "Barth",
    })
    await createEngraver({
      code: "durand",
      name: "Durand",
    })

    await expect(getDatabaseGeneralSummaryCounts()).resolves.toStrictEqual({
      catalogues: 2,
      compositions: 1,
      currencies: 3,
      distributions: 1,
      engravers: 2,
    })
  })

  it("keeps stable zero-valued rows when a maintained record type is empty", async () => {
    await expect(getDatabaseGeneralSummaryCounts()).resolves.toStrictEqual({
      catalogues: 0,
      compositions: 0,
      currencies: 0,
      distributions: 0,
      engravers: 0,
    })
  })
})
