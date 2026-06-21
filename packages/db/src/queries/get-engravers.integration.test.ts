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
      },
      {
        id: durand.id,
        code: "durand",
        name: "Engraver",
      },
      {
        id: ortiz.id,
        code: "ortiz",
        name: "Engraver",
      },
    ])
  })
})
