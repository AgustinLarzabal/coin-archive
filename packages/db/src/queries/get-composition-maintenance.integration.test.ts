import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createComposition } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getCompositionMaintenanceRecordWithDatabase,
  getCompositionMaintenanceRecordsWithDatabase,
} from "./get-composition-maintenance"

describe("Composition maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Composition", async () => {
    const created = await createComposition({ code: "silver", name: "Silver" })

    await expect(
      getCompositionMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "silver",
      name: "Silver",
      version: 1,
    })
    await expect(
      getCompositionMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const gold = await createComposition({ code: "gold", name: "Precious" })
    const silver = await createComposition({
      code: "silver",
      name: "Precious",
    })
    await createComposition({ code: "copper", name: "Copper" })

    const firstPage = await getCompositionMaintenanceRecordsWithDatabase(db, {
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
      throw new Error("Expected a first Composition page")

    await expect(
      getCompositionMaintenanceRecordsWithDatabase(db, {
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

  it("supports descending Composition Code order", async () => {
    const copper = await createComposition({ code: "copper", name: "Copper" })
    const silver = await createComposition({ code: "silver", name: "Silver" })

    await expect(
      getCompositionMaintenanceRecordsWithDatabase(db, {
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
