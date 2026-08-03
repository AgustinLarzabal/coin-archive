import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createRuler, createRulerGroup } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getRulerMaintenanceRecordWithDatabase,
  getRulerMaintenanceRecordsWithDatabase,
} from "./get-ruler-maintenance"

describe("Ruler maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns versioned detail with the optional Ruler Group", async () => {
    const group = await createRulerGroup({ code: "bourbon", name: "Bourbon" })
    const created = await createRuler({
      code: "felipe-v",
      name: "Felipe V",
      rulerGroupId: group.id,
    })

    await expect(
      getRulerMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      version: 1,
      group: { id: group.id, code: "bourbon", name: "Bourbon" },
    })
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const firstRuler = await createRuler({ code: "felipe-v", name: "Felipe" })
    const secondRuler = await createRuler({ code: "felipe-vi", name: "Felipe" })
    await createRuler({ code: "carlos-ii", name: "Carlos" })
    const firstPage = await getRulerMaintenanceRecordsWithDatabase(db, {
      q: "felipe",
      limit: 1,
      sort: "name",
      order: "asc",
    })
    const first = firstPage.at(0)
    expect(first?.id).toBe(firstRuler.id)
    if (first === undefined) throw new Error("Expected a first Ruler page")

    await expect(
      getRulerMaintenanceRecordsWithDatabase(db, {
        q: "felipe",
        limit: 2,
        sort: "name",
        order: "asc",
        cursor: {
          value: first.cursorValue,
          secondaryValue: first.cursorSecondaryValue,
          id: first.id,
        },
      })
    ).resolves.toStrictEqual([expect.objectContaining({ id: secondRuler.id })])
  })
})
