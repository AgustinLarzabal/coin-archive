import { describe, expect, it } from "vitest"
import { db } from "../index"
import { getCoin } from "./get-coin"
import {
  createCoin,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getCoin integration", () => {
  useTestDatabaseIsolation(db)

  it("returns the coin detail fields used by the detail page", async () => {
    const spain = await createIssuer({
      code: "spain",
      isoCode: "ES",
      name: "Spain",
    })
    const coin = await createCoin({
      title: "Detail Test Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-06-15T00:00:00.000Z"),
    })

    const detail = await getCoin(coin.id)

    expect(detail).toMatchObject({
      id: coin.id,
      title: "Detail Test Coin",
      issuer: {
        id: spain.id,
        code: "spain",
        isoCode: "ES",
        name: "Spain",
      },
    })
  })
})
