import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createRulerGroup } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getRulerGroups } from "./get-ruler-groups"

describe("getRulerGroups integration", () => {
  useTestDatabaseIsolation(db)

  it("returns ruler group options sorted by name, then code", async () => {
    const julioClaudians = await createRulerGroup({
      code: "julio-claudians",
      name: "Julio-Claudians",
    })
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const bourbonAlt = await createRulerGroup({
      code: "house-of-bourbon-spanish-branch",
      name: "House of Bourbon",
    })

    await expect(getRulerGroups()).resolves.toStrictEqual([
      {
        id: bourbon.id,
        code: "house-of-bourbon",
        name: "House of Bourbon",
        createdAt: bourbon.createdAt,
        updatedAt: bourbon.updatedAt,
      },
      {
        id: bourbonAlt.id,
        code: "house-of-bourbon-spanish-branch",
        name: "House of Bourbon",
        createdAt: bourbonAlt.createdAt,
        updatedAt: bourbonAlt.updatedAt,
      },
      {
        id: julioClaudians.id,
        code: "julio-claudians",
        name: "Julio-Claudians",
        createdAt: julioClaudians.createdAt,
        updatedAt: julioClaudians.updatedAt,
      },
    ])
  })
})
