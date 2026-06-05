import { describe, expect, it } from "vitest"
import { db } from "../index"
import { getDistributions } from "./get-distributions"
import { createDistribution } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getDistributions integration", () => {
  useTestDatabaseIsolation(db)

  it("returns distribution options sorted by name and code", async () => {
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const circulatingCommemorative = await createDistribution({
      code: "circulating-commemorative",
      name: "Circulating commemorative",
    })
    const circulationVariant = await createDistribution({
      code: "circulation-variant",
      name: "Standard circulation",
    })

    await expect(getDistributions()).resolves.toStrictEqual([
      {
        id: circulatingCommemorative.id,
        code: "circulating-commemorative",
        name: "Circulating commemorative",
        createdAt: circulatingCommemorative.createdAt,
        updatedAt: circulatingCommemorative.updatedAt,
      },
      {
        id: circulationVariant.id,
        code: "circulation-variant",
        name: "Standard circulation",
        createdAt: circulationVariant.createdAt,
        updatedAt: circulationVariant.updatedAt,
      },
      {
        id: standardCirculation.id,
        code: "standard-circulation",
        name: "Standard circulation",
        createdAt: standardCirculation.createdAt,
        updatedAt: standardCirculation.updatedAt,
      },
    ])
  })
})
