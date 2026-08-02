import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createCurrency } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getCurrencyMaintenanceRecordWithDatabase,
  getCurrencyMaintenanceRecordsWithDatabase,
} from "./get-currency-maintenance"

describe("Currency maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Currency", async () => {
    const created = await createCurrency({
      code: "united-states-dollar",
      name: "Dollar",
      fullName: "United States dollar",
    })

    await expect(
      getCurrencyMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "united-states-dollar",
      name: "Dollar",
      fullName: "United States dollar",
      version: 1,
    })
    await expect(
      getCurrencyMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const gold = await createCurrency({
      code: "a-dollar",
      name: "Dollar",
      fullName: "Precious dollar",
    })
    const silver = await createCurrency({
      code: "b-dollar",
      name: "Dollar",
      fullName: "Precious dollar",
    })
    await createCurrency({ code: "euro", name: "Euro", fullName: "Euro" })

    const firstPage = await getCurrencyMaintenanceRecordsWithDatabase(db, {
      q: "precious",
      limit: 1,
      sort: "fullName",
      order: "asc",
    })
    expect(firstPage).toHaveLength(1)
    const first = firstPage.at(0)
    expect(first?.id).toBe(gold.id)
    expect(first?.cursorValue).toBe("precious dollar")
    expect(first?.cursorSecondaryValue).toBe("a-dollar")
    if (first === undefined) throw new Error("Expected a first Currency page")

    await expect(
      getCurrencyMaintenanceRecordsWithDatabase(db, {
        q: "precious",
        limit: 2,
        sort: "fullName",
        order: "asc",
        cursor: {
          value: first.cursorValue,
          secondaryValue: first.cursorSecondaryValue,
          id: first.id,
        },
      })
    ).resolves.toStrictEqual([expect.objectContaining({ id: silver.id })])
  })

  it("supports descending Currency Code order", async () => {
    const copper = await createCurrency({
      code: "euro",
      name: "Euro",
      fullName: "Euro",
    })
    const silver = await createCurrency({
      code: "yen",
      name: "Yen",
      fullName: "Japanese yen",
    })

    await expect(
      getCurrencyMaintenanceRecordsWithDatabase(db, {
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
