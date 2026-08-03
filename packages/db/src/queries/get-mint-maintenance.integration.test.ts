import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createMint } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getMintMaintenanceRecordWithDatabase,
  getMintMaintenanceRecordsWithDatabase,
} from "./get-mint-maintenance"

describe("Mint maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Mint", async () => {
    const created = await createMint({ code: "madrid", name: "Madrid" })
    await expect(
      getMintMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "madrid",
      name: "Madrid",
      version: 1,
    })
    await expect(
      getMintMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const buenosAires = await createMint({
      code: "buenos-aires",
      name: "Royal Mint",
    })
    const madrid = await createMint({ code: "madrid", name: "Royal Mint" })
    await createMint({ code: "london", name: "London" })
    const firstPage = await getMintMaintenanceRecordsWithDatabase(db, {
      q: "royal",
      limit: 1,
      sort: "name",
      order: "asc",
    })
    const first = firstPage.at(0)
    expect(first?.id).toBe(buenosAires.id)
    expect(first?.cursorValue).toBe("royal mint")
    expect(first?.cursorSecondaryValue).toBe("buenos-aires")
    if (first === undefined) throw new Error("Expected a first Mint page")
    await expect(
      getMintMaintenanceRecordsWithDatabase(db, {
        q: "royal",
        limit: 2,
        sort: "name",
        order: "asc",
        cursor: {
          value: first.cursorValue,
          secondaryValue: first.cursorSecondaryValue,
          id: first.id,
        },
      })
    ).resolves.toStrictEqual([expect.objectContaining({ id: madrid.id })])
  })

  it("supports descending Mint Code order", async () => {
    const buenosAires = await createMint({
      code: "buenos-aires",
      name: "Buenos Aires",
    })
    const madrid = await createMint({ code: "madrid", name: "Madrid" })
    await expect(
      getMintMaintenanceRecordsWithDatabase(db, {
        limit: 2,
        sort: "code",
        order: "desc",
      })
    ).resolves.toEqual([
      expect.objectContaining({ id: madrid.id }),
      expect.objectContaining({ id: buenosAires.id }),
    ])
  })
})
