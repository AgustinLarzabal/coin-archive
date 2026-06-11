import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createEngraver } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getEngravers } from "./get-engravers"

describe("getEngravers integration", () => {
  useTestDatabaseIsolation(db)

  it("returns engraver options sorted by name and code", async () => {
    const barth = await createEngraver({
      code: "barth",
      name: "Barth",
    })
    const durand = await createEngraver({
      code: "durand",
      name: "Engraver",
    })
    const ortiz = await createEngraver({
      code: "ortiz",
      name: "Engraver",
    })

    await expect(getEngravers()).resolves.toStrictEqual([
      {
        id: barth.id,
        code: "barth",
        name: "Barth",
        createdAt: barth.createdAt,
        updatedAt: barth.updatedAt,
      },
      {
        id: durand.id,
        code: "durand",
        name: "Engraver",
        createdAt: durand.createdAt,
        updatedAt: durand.updatedAt,
      },
      {
        id: ortiz.id,
        code: "ortiz",
        name: "Engraver",
        createdAt: ortiz.createdAt,
        updatedAt: ortiz.updatedAt,
      },
    ])
  })
})
