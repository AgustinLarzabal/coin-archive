import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createEngraver } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getEngraverMaintenanceRecordWithDatabase,
  getEngraverMaintenanceRecordsWithDatabase,
} from "./get-engraver-maintenance"

describe("Engraver maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Engraver", async () => {
    const created = await createEngraver({ code: "reeded", name: "Reeded" })
    await expect(
      getEngraverMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "reeded",
      name: "Reeded",
      version: 1,
    })
    await expect(
      getEngraverMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const plain = await createEngraver({ code: "plain", name: "Surface" })
    const reeded = await createEngraver({ code: "reeded", name: "Surface" })
    await createEngraver({ code: "lettered", name: "Lettered" })
    const firstPage = await getEngraverMaintenanceRecordsWithDatabase(db, {
      q: "surface",
      limit: 1,
      sort: "name",
      order: "asc",
    })
    const first = firstPage.at(0)
    expect(first?.id).toBe(plain.id)
    expect(first?.cursorValue).toBe("surface")
    expect(first?.cursorSecondaryValue).toBe("plain")
    if (first === undefined) throw new Error("Expected a first Engraver page")
    await expect(
      getEngraverMaintenanceRecordsWithDatabase(db, {
        q: "surface",
        limit: 2,
        sort: "name",
        order: "asc",
        cursor: {
          value: first.cursorValue,
          secondaryValue: first.cursorSecondaryValue,
          id: first.id,
        },
      })
    ).resolves.toStrictEqual([expect.objectContaining({ id: reeded.id })])
  })

  it("supports descending Engraver Code order", async () => {
    const plain = await createEngraver({ code: "plain", name: "Plain" })
    const reeded = await createEngraver({ code: "reeded", name: "Reeded" })
    await expect(
      getEngraverMaintenanceRecordsWithDatabase(db, {
        limit: 2,
        sort: "code",
        order: "desc",
      })
    ).resolves.toEqual([
      expect.objectContaining({ id: reeded.id }),
      expect.objectContaining({ id: plain.id }),
    ])
  })
})
