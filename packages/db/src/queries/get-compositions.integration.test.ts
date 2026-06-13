import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createComposition } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getCompositions } from "./get-compositions"

describe("getCompositions integration", () => {
  useTestDatabaseIsolation(db)

  it("returns composition options sorted by name and code", async () => {
    const silver900 = await createComposition({
      code: "silver-900",
      name: "Silver (.900)",
      description: "Ninety percent silver alloy.",
    })
    const copperNickel = await createComposition({
      code: "copper-nickel",
      name: "Copper-nickel",
    })
    const copper = await createComposition({
      code: "copper",
      name: "Copper-nickel",
    })

    await expect(getCompositions()).resolves.toStrictEqual([
      {
        id: copper.id,
        code: "copper",
        name: "Copper-nickel",
        description: null,
        createdAt: copper.createdAt,
        updatedAt: copper.updatedAt,
      },
      {
        id: copperNickel.id,
        code: "copper-nickel",
        name: "Copper-nickel",
        description: null,
        createdAt: copperNickel.createdAt,
        updatedAt: copperNickel.updatedAt,
      },
      {
        id: silver900.id,
        code: "silver-900",
        name: "Silver (.900)",
        description: "Ninety percent silver alloy.",
        createdAt: silver900.createdAt,
        updatedAt: silver900.updatedAt,
      },
    ])
  })
})
