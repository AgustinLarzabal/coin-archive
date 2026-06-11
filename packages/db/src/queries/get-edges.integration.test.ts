import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createEdge } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getEdges } from "./get-edges"

describe("getEdges integration", () => {
  useTestDatabaseIsolation(db)

  it("returns edge options sorted by name and code", async () => {
    const lettered = await createEdge({
      code: "lettered",
      name: "Lettered",
    })
    const plain = await createEdge({
      code: "plain",
      name: "Plain",
    })
    const reeded = await createEdge({
      code: "reeded",
      name: "Plain",
    })

    await expect(getEdges()).resolves.toStrictEqual([
      {
        id: lettered.id,
        code: "lettered",
        name: "Lettered",
        createdAt: lettered.createdAt,
        updatedAt: lettered.updatedAt,
      },
      {
        id: plain.id,
        code: "plain",
        name: "Plain",
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
      },
      {
        id: reeded.id,
        code: "reeded",
        name: "Plain",
        createdAt: reeded.createdAt,
        updatedAt: reeded.updatedAt,
      },
    ])
  })
})
