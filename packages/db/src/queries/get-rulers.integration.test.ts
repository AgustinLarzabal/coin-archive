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

    const felipeV = await createRuler({
      code: "felipe-v",
      name: "Felipe",
      rulerGroupId: bourbon.id,
    })
    const felipeVi = await createRuler({
      code: "felipe-vi",
      name: "Felipe",
      rulerGroupId: bourbon.id,
    })
    const liberty = await createRuler({
      code: "liberty",
      name: "Liberty",
    })

    await expect(getRulers()).resolves.toStrictEqual([
      {
        id: felipeV.id,
        code: "felipe-v",
        name: "Felipe",
        createdAt: felipeV.createdAt,
        updatedAt: felipeV.updatedAt,
        group: {
          id: bourbon.id,
          code: "house-of-bourbon",
          name: "House of Bourbon",
          createdAt: bourbon.createdAt,
          updatedAt: bourbon.updatedAt,
        },
      },
      {
        id: felipeVi.id,
        code: "felipe-vi",
        name: "Felipe",
        createdAt: felipeVi.createdAt,
        updatedAt: felipeVi.updatedAt,
        group: {
          id: bourbon.id,
          code: "house-of-bourbon",
          name: "House of Bourbon",
          createdAt: bourbon.createdAt,
          updatedAt: bourbon.updatedAt,
        },
      },
      {
        id: liberty.id,
        code: "liberty",
        name: "Liberty",
        createdAt: liberty.createdAt,
        updatedAt: liberty.updatedAt,
        group: null,
      },
    ])
  })
})
