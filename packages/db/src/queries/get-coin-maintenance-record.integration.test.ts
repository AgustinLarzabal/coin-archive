import { eq, sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { db, getCoinMaintenanceApiRecordWithDatabase } from "../index"
import { coin } from "../schema/coin"
import {
  createCoin,
  createComposition,
  createCurrency,
  createDistribution,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getCoinMaintenanceApiRecordWithDatabase integration", () => {
  useTestDatabaseIsolation(db)

  it("preserves exact PostgreSQL decimals and bigint values as strings", async () => {
    const issuer = await createIssuer({ code: "exact", name: "Exact" })
    const distribution = await createDistribution({
      code: "exact",
      name: "Exact",
    })
    const currency = await createCurrency({
      code: "exact",
      name: "Exact",
      fullName: "Exact",
    })
    const composition = await createComposition({
      code: "exact",
      name: "Exact",
    })
    const created = await createCoin({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      title: "Exact Decimal Coin",
      issuerId: issuer.id,
      distributionId: distribution.id,
      currencyId: currency.id,
      compositionId: composition.id,
    })
    await db
      .update(coin)
      .set({
        faceValueNumericValue: sql`12345678901234.123456`,
        mintage: sql`9007199254740993`,
      })
      .where(eq(coin.id, created.id))

    await expect(
      getCoinMaintenanceApiRecordWithDatabase(db, created.id)
    ).resolves.toMatchObject({
      faceValueNumericValue: "12345678901234.123456",
      mintage: "9007199254740993",
    })
  })
})
