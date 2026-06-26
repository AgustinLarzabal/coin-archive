import { describe, expect, it } from "vitest"

import { db, getDatabaseGeneralSummaryCounts } from "../index"
import {
  createCatalogue,
  createComposition,
  createCurrency,
  createDistribution,
  createEdge,
  createEngraver,
  createIssuer,
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
    await createEdge({
      code: "reeded",
      name: "Reeded",
    })
    await createEdge({
      code: "plain",
      name: "Plain",
    })
    await createEngraver({
      code: "barth",
      name: "Barth",
    })
    await createEngraver({
      code: "durand",
      name: "Durand",
    })
    await createIssuer({
      code: "argentine-republic",
      name: "Argentine Republic",
      isoCode: "AR",
    })
    await createIssuer({
      code: "united-states",
      name: "United States",
      isoCode: "US",
    })

    await expect(getDatabaseGeneralSummaryCounts()).resolves.toStrictEqual({
      catalogues: 2,
      compositions: 1,
      currencies: 3,
      distributions: 1,
      edges: 2,
      engravers: 2,
      issuers: 2,
    })
  })

  it("keeps stable zero-valued rows when a maintained record type is empty", async () => {
    await expect(getDatabaseGeneralSummaryCounts()).resolves.toStrictEqual({
      catalogues: 0,
      compositions: 0,
      currencies: 0,
      distributions: 0,
      edges: 0,
      engravers: 0,
      issuers: 0,
    })
  })
})
