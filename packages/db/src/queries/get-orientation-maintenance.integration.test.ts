import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createOrientation } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getOrientationMaintenanceRecordWithDatabase,
  getOrientationMaintenanceRecordsWithDatabase,
} from "./get-orientation-maintenance"

describe("Orientation maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("returns current versioned detail and null for a missing Orientation", async () => {
    const created = await createOrientation({
      code: "coin-alignment",
      name: "Coin alignment",
    })

    await expect(
      getOrientationMaintenanceRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      id: created.id,
      code: "coin-alignment",
      name: "Coin alignment",
      version: 1,
    })
    await expect(
      getOrientationMaintenanceRecordWithDatabase(
        db,
        "018f1a11-aaaa-7000-8000-000000000001"
      )
    ).resolves.toBeNull()
  })

  it("searches and cursor-paginates a stable name-ordered collection", async () => {
    const coin = await createOrientation({
      code: "coin-alignment",
      name: "Alignment",
    })
    const medal = await createOrientation({
      code: "medal-alignment",
      name: "Alignment",
    })
    await createOrientation({ code: "plain", name: "Plain" })

    const firstPage = await getOrientationMaintenanceRecordsWithDatabase(db, {
      q: "align",
      limit: 1,
      sort: "name",
      order: "asc",
    })
    expect(firstPage).toHaveLength(1)
    const first = firstPage.at(0)
    expect(first?.id).toBe(coin.id)
    expect(first?.cursorValue).toBe("alignment")
    expect(first?.cursorSecondaryValue).toBe("coin-alignment")
    if (first === undefined)
      throw new Error("Expected a first Orientation page")

    await expect(
      getOrientationMaintenanceRecordsWithDatabase(db, {
        q: "align",
        limit: 2,
        sort: "name",
        order: "asc",
        cursor: {
          value: first.cursorValue,
          secondaryValue: first.cursorSecondaryValue,
          id: first.id,
        },
      })
    ).resolves.toStrictEqual([expect.objectContaining({ id: medal.id })])
  })

  it("supports descending Orientation Code order", async () => {
    const coin = await createOrientation({
      code: "coin-alignment",
      name: "Coin alignment",
    })
    const medal = await createOrientation({
      code: "medal-alignment",
      name: "Medal alignment",
    })

    await expect(
      getOrientationMaintenanceRecordsWithDatabase(db, {
        limit: 2,
        sort: "code",
        order: "desc",
      })
    ).resolves.toEqual([
      expect.objectContaining({ id: medal.id }),
      expect.objectContaining({ id: coin.id }),
    ])
  })
})
