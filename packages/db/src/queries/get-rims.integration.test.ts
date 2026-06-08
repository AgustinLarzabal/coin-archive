import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createRim } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getRims } from "./get-rims"

describe("getRims integration", () => {
  useTestDatabaseIsolation(db)

  it("returns rim options sorted by name, then code", async () => {
    const plain = await createRim({
      code: "plain",
      name: "Plain",
    })
    const raised = await createRim({
      code: "raised-both-sides",
      name: "Raised, both sides",
    })
    const raisedAlt = await createRim({
      code: "raised-obverse-only",
      name: "Raised, both sides",
    })

    await expect(getRims()).resolves.toStrictEqual([
      {
        id: plain.id,
        code: "plain",
        name: "Plain",
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
      },
      {
        id: raisedAlt.id,
        code: "raised-obverse-only",
        name: "Raised, both sides",
        createdAt: raisedAlt.createdAt,
        updatedAt: raisedAlt.updatedAt,
      },
      {
        id: raised.id,
        code: "raised-both-sides",
        name: "Raised, both sides",
        createdAt: raised.createdAt,
        updatedAt: raised.updatedAt,
      },
    ])
  })
})
