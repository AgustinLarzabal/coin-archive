import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createRim } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getRimMaintenanceRecordWithDatabase,
  getRimMaintenanceRecordsWithDatabase,
} from "./get-rim-maintenance"

describe("Rim maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Rim", async () => {
    const created = await createRim({ code: "reeded", name: "Reeded" })
    await expect(
      getRimMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "reeded",
      name: "Reeded",
      version: 1,
    })
    await expect(
      getRimMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const plain = await createRim({ code: "plain", name: "Surface" })
    const reeded = await createRim({ code: "reeded", name: "Surface" })
    await createRim({ code: "lettered", name: "Lettered" })
    const firstPage = await getRimMaintenanceRecordsWithDatabase(db, {
      q: "surface",
      limit: 1,
      sort: "name",
      order: "asc",
    })
    const first = firstPage.at(0)
    expect(first?.id).toBe(plain.id)
    expect(first?.cursorValue).toBe("surface")
    expect(first?.cursorSecondaryValue).toBe("plain")
    if (first === undefined) throw new Error("Expected a first Rim page")
    await expect(
      getRimMaintenanceRecordsWithDatabase(db, {
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

  it("supports descending Rim Code order", async () => {
    const plain = await createRim({ code: "plain", name: "Plain" })
    const reeded = await createRim({ code: "reeded", name: "Reeded" })
    await expect(
      getRimMaintenanceRecordsWithDatabase(db, {
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
