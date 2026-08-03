import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createRulerGroup } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getRulerGroupMaintenanceRecordWithDatabase,
  getRulerGroupMaintenanceRecordsWithDatabase,
} from "./get-ruler-group-maintenance"

describe("Ruler Group maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Ruler Group", async () => {
    const created = await createRulerGroup({ code: "reeded", name: "Reeded" })
    await expect(
      getRulerGroupMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "reeded",
      name: "Reeded",
      version: 1,
    })
    await expect(
      getRulerGroupMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const plain = await createRulerGroup({ code: "plain", name: "Surface" })
    const reeded = await createRulerGroup({ code: "reeded", name: "Surface" })
    await createRulerGroup({ code: "lettered", name: "Lettered" })
    const firstPage = await getRulerGroupMaintenanceRecordsWithDatabase(db, {
      q: "surface",
      limit: 1,
      sort: "name",
      order: "asc",
    })
    const first = firstPage.at(0)
    expect(first?.id).toBe(plain.id)
    expect(first?.cursorValue).toBe("surface")
    expect(first?.cursorSecondaryValue).toBe("plain")
    if (first === undefined) throw new Error("Expected a first Ruler Group page")
    await expect(
      getRulerGroupMaintenanceRecordsWithDatabase(db, {
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

  it("supports descending Ruler Group Code order", async () => {
    const plain = await createRulerGroup({ code: "plain", name: "Plain" })
    const reeded = await createRulerGroup({ code: "reeded", name: "Reeded" })
    await expect(
      getRulerGroupMaintenanceRecordsWithDatabase(db, {
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
