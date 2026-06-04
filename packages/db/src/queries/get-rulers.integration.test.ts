import { describe, expect, it } from "vitest"
import { db, getRulers } from "../index"
import { createRuler, createRulerGroup } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getRulers integration", () => {
  useTestDatabaseIsolation(db)

  it("returns rulers sorted by name and code with optional group data", async () => {
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })

    await createRuler({
      code: "felipe-v",
      name: "Felipe",
      rulerGroupId: bourbon.id,
    })
    await createRuler({
      code: "felipe-vi",
      name: "Felipe",
      rulerGroupId: bourbon.id,
    })
    await createRuler({
      code: "liberty",
      name: "Liberty",
    })

    await expect(getRulers()).resolves.toStrictEqual([
      {
        code: "felipe-v",
        name: "Felipe",
        group: {
          code: "house-of-bourbon",
          name: "House of Bourbon",
        },
      },
      {
        code: "felipe-vi",
        name: "Felipe",
        group: {
          code: "house-of-bourbon",
          name: "House of Bourbon",
        },
      },
      {
        code: "liberty",
        name: "Liberty",
        group: null,
      },
    ])
  })
})
