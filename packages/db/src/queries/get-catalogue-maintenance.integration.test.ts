import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createCatalogue } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getCatalogueMaintenanceRecordWithDatabase,
  getCatalogueMaintenanceRecordsWithDatabase,
} from "./get-catalogue-maintenance"

describe("Catalogue maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Catalogue", async () => {
    const created = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })

    await expect(
      getCatalogueMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "KM",
      title: "Standard Catalog of World Coins",
      version: 1,
    })
    await expect(
      getCatalogueMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable title-ordered collection", async () => {
    const km = await createCatalogue({ code: "KM", title: "World Coins" })
    const scwc = await createCatalogue({ code: "SCWC", title: "World Coins" })
    await createCatalogue({ code: "RIC", title: "Roman Imperial Coinage" })

    const firstPage = await getCatalogueMaintenanceRecordsWithDatabase(db, {
      q: "world",
      limit: 1,
      sort: "title",
      order: "asc",
    })
    expect(firstPage).toHaveLength(1)
    const first = firstPage.at(0)
    expect(first?.id).toBe(km.id)
    expect(first?.cursorValue).toBe("world coins")
    expect(first?.cursorSecondaryValue).toBe("km")
    if (first === undefined) throw new Error("Expected a first Catalogue page")

    await expect(
      getCatalogueMaintenanceRecordsWithDatabase(db, {
        q: "world",
        limit: 2,
        sort: "title",
        order: "asc",
        cursor: {
          value: first.cursorValue,
          secondaryValue: first.cursorSecondaryValue,
          id: first.id,
        },
      })
    ).resolves.toStrictEqual([expect.objectContaining({ id: scwc.id })])
  })

  it("supports descending Catalogue Code order", async () => {
    const km = await createCatalogue({ code: "KM", title: "World Coins" })
    const ric = await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })

    await expect(
      getCatalogueMaintenanceRecordsWithDatabase(db, {
        limit: 2,
        sort: "code",
        order: "desc",
      })
    ).resolves.toEqual([
      expect.objectContaining({ id: ric.id }),
      expect.objectContaining({ id: km.id }),
    ])
  })
})
