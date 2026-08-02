import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createDistribution } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getDistributionMaintenanceRecordWithDatabase,
  getDistributionMaintenanceRecordsWithDatabase,
} from "./get-distribution-maintenance"

describe("Distribution maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Distribution", async () => {
    const created = await createDistribution({ code: "silver", name: "Silver" })

    await expect(
      getDistributionMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "silver",
      name: "Silver",
      version: 1,
    })
    await expect(
      getDistributionMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const gold = await createDistribution({ code: "gold", name: "Precious" })
    const silver = await createDistribution({
      code: "silver",
      name: "Precious",
    })
    await createDistribution({ code: "copper", name: "Copper" })

    const firstPage = await getDistributionMaintenanceRecordsWithDatabase(db, {
      q: "precious",
      limit: 1,
      sort: "name",
      order: "asc",
    })
    expect(firstPage).toHaveLength(1)
    const first = firstPage.at(0)
    expect(first?.id).toBe(gold.id)
    expect(first?.cursorValue).toBe("precious")
    expect(first?.cursorSecondaryValue).toBe("gold")
    if (first === undefined)
      throw new Error("Expected a first Distribution page")

    await expect(
      getDistributionMaintenanceRecordsWithDatabase(db, {
        q: "precious",
        limit: 2,
        sort: "name",
        order: "asc",
        cursor: {
          value: first.cursorValue,
          secondaryValue: first.cursorSecondaryValue,
          id: first.id,
        },
      })
    ).resolves.toStrictEqual([expect.objectContaining({ id: silver.id })])
  })

  it("supports descending Distribution Code order", async () => {
    const copper = await createDistribution({ code: "copper", name: "Copper" })
    const silver = await createDistribution({ code: "silver", name: "Silver" })

    await expect(
      getDistributionMaintenanceRecordsWithDatabase(db, {
        limit: 2,
        sort: "code",
        order: "desc",
      })
    ).resolves.toEqual([
      expect.objectContaining({ id: silver.id }),
      expect.objectContaining({ id: copper.id }),
    ])
  })
})
