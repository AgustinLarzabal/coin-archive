import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createOrientation } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getOrientations } from "./get-orientations"

describe("getOrientations integration", () => {
  useTestDatabaseIsolation(db)

  it("returns orientation options sorted by name, then code", async () => {
    const medal = await createOrientation({
      code: "medal-alignment",
      name: "Medal alignment",
    })
    const coin = await createOrientation({
      code: "coin-alignment",
      name: "Coin alignment",
    })
    const coinAlt = await createOrientation({
      code: "coin-alignment-alt",
      name: "Coin alignment",
    })

    await expect(getOrientations()).resolves.toStrictEqual([
      {
        id: coin.id,
        code: "coin-alignment",
        name: "Coin alignment",
        createdAt: coin.createdAt,
        updatedAt: coin.updatedAt,
      },
      {
        id: coinAlt.id,
        code: "coin-alignment-alt",
        name: "Coin alignment",
        createdAt: coinAlt.createdAt,
        updatedAt: coinAlt.updatedAt,
      },
      {
        id: medal.id,
        code: "medal-alignment",
        name: "Medal alignment",
        createdAt: medal.createdAt,
        updatedAt: medal.updatedAt,
      },
    ])
  })
})
