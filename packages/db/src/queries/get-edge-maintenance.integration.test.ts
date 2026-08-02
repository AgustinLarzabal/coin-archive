import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createEdge } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getEdgeMaintenanceRecordWithDatabase,
  getEdgeMaintenanceRecordsWithDatabase,
} from "./get-edge-maintenance"

describe("Edge maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Edge", async () => {
    const created = await createEdge({ code: "reeded", name: "Reeded" })
    await expect(
      getEdgeMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "reeded",
      name: "Reeded",
      version: 1,
    })
    await expect(
      getEdgeMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const plain = await createEdge({ code: "plain", name: "Surface" })
    const reeded = await createEdge({ code: "reeded", name: "Surface" })
    await createEdge({ code: "lettered", name: "Lettered" })
    const firstPage = await getEdgeMaintenanceRecordsWithDatabase(db, {
      q: "surface",
      limit: 1,
      sort: "name",
      order: "asc",
    })
    const first = firstPage.at(0)
    expect(first?.id).toBe(plain.id)
    expect(first?.cursorValue).toBe("surface")
    expect(first?.cursorSecondaryValue).toBe("plain")
    if (first === undefined) throw new Error("Expected a first Edge page")
    await expect(
      getEdgeMaintenanceRecordsWithDatabase(db, {
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

  it("supports descending Edge Code order", async () => {
    const plain = await createEdge({ code: "plain", name: "Plain" })
    const reeded = await createEdge({ code: "reeded", name: "Reeded" })
    await expect(
      getEdgeMaintenanceRecordsWithDatabase(db, {
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
