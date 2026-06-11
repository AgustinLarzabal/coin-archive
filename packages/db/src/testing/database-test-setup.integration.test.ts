import { count } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "../index"
import { coin } from "../schema/coin"
import { createCoin, createIssuer } from "./fixtures"
import { useTestDatabaseIsolation } from "./test-database"

describe("PostgreSQL integration test setup", () => {
  useTestDatabaseIsolation(db)

  it("runs against the dedicated test database and can write smoke data", async () => {
    const romanEmpire = await createIssuer({
      code: "roman-empire-test",
      name: "Roman Empire Test",
    })

    await createCoin({
      issuerId: romanEmpire.id,
      title: "Setup Smoke Coin",
      createdAt: new Date("2026-06-03T00:00:00.000Z"),
    })

    const result = (await db.select({ coinCount: count() }).from(coin)).at(0)

    expect(result?.coinCount).toBe(1)
  })

  it("clears known tables between tests with the explicit helper", async () => {
    const result = (await db.select({ coinCount: count() }).from(coin)).at(0)

    expect(result?.coinCount).toBe(0)
  })
})
