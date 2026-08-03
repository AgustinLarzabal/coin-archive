import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createShape } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getShapeMaintenanceRecordWithDatabase,
  getShapeMaintenanceRecordsWithDatabase,
} from "./get-shape-maintenance"

describe("Shape maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Shape", async () => {
    const created = await createShape({ code: "reeded", name: "Reeded" })
    await expect(
      getShapeMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "reeded",
      name: "Reeded",
      version: 1,
    })
    await expect(
      getShapeMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const plain = await createShape({ code: "plain", name: "Surface" })
    const reeded = await createShape({ code: "reeded", name: "Surface" })
    await createShape({ code: "lettered", name: "Lettered" })
    const firstPage = await getShapeMaintenanceRecordsWithDatabase(db, {
      q: "surface",
      limit: 1,
      sort: "name",
      order: "asc",
    })
    const first = firstPage.at(0)
    expect(first?.id).toBe(plain.id)
    expect(first?.cursorValue).toBe("surface")
    expect(first?.cursorSecondaryValue).toBe("plain")
    if (first === undefined) throw new Error("Expected a first Shape page")
    await expect(
      getShapeMaintenanceRecordsWithDatabase(db, {
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

  it("supports descending Shape Code order", async () => {
    const plain = await createShape({ code: "plain", name: "Plain" })
    const reeded = await createShape({ code: "reeded", name: "Reeded" })
    await expect(
      getShapeMaintenanceRecordsWithDatabase(db, {
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
