import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createTechnique } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getTechniqueMaintenanceRecordWithDatabase,
  getTechniqueMaintenanceRecordsWithDatabase,
} from "./get-technique-maintenance"

describe("Technique maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Technique", async () => {
    const created = await createTechnique({ code: "reeded", name: "Reeded" })
    await expect(
      getTechniqueMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "reeded",
      name: "Reeded",
      version: 1,
    })
    await expect(
      getTechniqueMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const plain = await createTechnique({ code: "plain", name: "Surface" })
    const reeded = await createTechnique({ code: "reeded", name: "Surface" })
    await createTechnique({ code: "lettered", name: "Lettered" })
    const firstPage = await getTechniqueMaintenanceRecordsWithDatabase(db, {
      q: "surface",
      limit: 1,
      sort: "name",
      order: "asc",
    })
    const first = firstPage.at(0)
    expect(first?.id).toBe(plain.id)
    expect(first?.cursorValue).toBe("surface")
    expect(first?.cursorSecondaryValue).toBe("plain")
    if (first === undefined) throw new Error("Expected a first Technique page")
    await expect(
      getTechniqueMaintenanceRecordsWithDatabase(db, {
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

  it("supports descending Technique Code order", async () => {
    const plain = await createTechnique({ code: "plain", name: "Plain" })
    const reeded = await createTechnique({ code: "reeded", name: "Reeded" })
    await expect(
      getTechniqueMaintenanceRecordsWithDatabase(db, {
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
