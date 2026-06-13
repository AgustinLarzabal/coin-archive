import { describe, expect, it } from "vitest"

import { db, getCatalogues } from "../index"
import { createCatalogue } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getCatalogues integration", () => {
  useTestDatabaseIsolation(db)

  it("returns full catalogue option metadata sorted by title then code", async () => {
    const standardCatalog = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const anotherStandardCatalog = await createCatalogue({
      code: "SCWC",
      title: "Another Standard Catalog of World Coins",
    })
    const romanImperialCoinage = await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })

    await expect(getCatalogues()).resolves.toStrictEqual([
      {
        id: anotherStandardCatalog.id,
        code: "SCWC",
        title: "Another Standard Catalog of World Coins",
        createdAt: anotherStandardCatalog.createdAt,
        updatedAt: anotherStandardCatalog.updatedAt,
      },
      {
        id: romanImperialCoinage.id,
        code: "RIC",
        title: "Roman Imperial Coinage",
        createdAt: romanImperialCoinage.createdAt,
        updatedAt: romanImperialCoinage.updatedAt,
      },
      {
        id: standardCatalog.id,
        code: "KM",
        title: "Standard Catalog of World Coins",
        createdAt: standardCatalog.createdAt,
        updatedAt: standardCatalog.updatedAt,
      },
    ])
  })
})
