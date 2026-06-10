import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createTechnique } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getTechniques } from "./get-techniques"

describe("getTechniques integration", () => {
  useTestDatabaseIsolation(db)

  it("returns Minting Technique options sorted by name, then code", async () => {
    const milled = await createTechnique({
      code: "milled",
      name: "Milled",
    })
    const milledAlt = await createTechnique({
      code: "milled-alt",
      name: "Milled",
    })
    const hammered = await createTechnique({
      code: "hammered",
      name: "Hammered",
    })

    await expect(getTechniques()).resolves.toStrictEqual([
      {
        id: hammered.id,
        code: "hammered",
        name: "Hammered",
        createdAt: hammered.createdAt,
        updatedAt: hammered.updatedAt,
      },
      {
        id: milled.id,
        code: "milled",
        name: "Milled",
        createdAt: milled.createdAt,
        updatedAt: milled.updatedAt,
      },
      {
        id: milledAlt.id,
        code: "milled-alt",
        name: "Milled",
        createdAt: milledAlt.createdAt,
        updatedAt: milledAlt.updatedAt,
      },
    ])
  })
})
