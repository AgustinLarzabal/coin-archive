import { count } from "drizzle-orm"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { coin } from "../schema/coin"
import { clearDatabaseTables } from "./database-test-client"
import {
  closeTestDatabase,
  insertCoin,
  insertIssuer,
  testDb,
} from "./database-test-fixtures"

describe("PostgreSQL integration test setup", () => {
  beforeEach(async () => {
    await clearDatabaseTables(testDb)
  })

  afterAll(async () => {
    await closeTestDatabase()
  })

  it("runs against the dedicated test database and can write smoke data", async () => {
    const romanEmpire = await insertIssuer({
      code: "roman-empire-test",
      name: "Roman Empire Test",
    })

    await insertCoin({
      issuerId: romanEmpire.id,
      title: "Setup Smoke Coin",
      createdAt: new Date("2026-06-03T00:00:00.000Z"),
    })

    const [result] = await testDb.select({ coinCount: count() }).from(coin)

    expect(result?.coinCount).toBe(1)
  })

  it("clears known tables between tests with the explicit helper", async () => {
    const [result] = await testDb.select({ coinCount: count() }).from(coin)

    expect(result?.coinCount).toBe(0)
  })
})
