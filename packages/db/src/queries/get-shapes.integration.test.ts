import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createShape } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getShapes } from "./get-shapes"

describe("getShapes integration", () => {
  useTestDatabaseIsolation(db)

  it("returns shape options sorted by name, then code", async () => {
    const scalloped = await createShape({
      code: "scalloped",
      name: "Scalloped",
    })
    const round = await createShape({
      code: "round",
      name: "Round",
    })
    const roundAlt = await createShape({
      code: "round-alt",
      name: "Round",
    })

    await expect(getShapes()).resolves.toStrictEqual([
      {
        id: round.id,
        code: "round",
        name: "Round",
        createdAt: round.createdAt,
        updatedAt: round.updatedAt,
      },
      {
        id: roundAlt.id,
        code: "round-alt",
        name: "Round",
        createdAt: roundAlt.createdAt,
        updatedAt: roundAlt.updatedAt,
      },
      {
        id: scalloped.id,
        code: "scalloped",
        name: "Scalloped",
        createdAt: scalloped.createdAt,
        updatedAt: scalloped.updatedAt,
      },
    ])
  })
})
