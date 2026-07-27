import { randomUUID } from "node:crypto"
import { count, eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { createDatabaseClient } from "../database"
import { getDatabaseTestUrl } from "../env"
import {
  getDatabaseName,
  getMaintenanceDatabaseUrl,
} from "../testing/database-test-env"

const databaseUrl = getDatabaseTestUrl()
const resetDatabaseName = `${getDatabaseName(databaseUrl)}_reset_${randomUUID().replaceAll("-", "")}`
const resetDatabaseUrl = new URL(databaseUrl)
resetDatabaseUrl.pathname = `/${resetDatabaseName}`

function escapePostgresIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

describe("database reset and reseed", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL
  const maintenanceClient = createDatabaseClient(
    getMaintenanceDatabaseUrl(databaseUrl)
  )

  beforeAll(async () => {
    await maintenanceClient.unsafe(
      `create database ${escapePostgresIdentifier(resetDatabaseName)}`
    )
    process.env.DATABASE_URL = resetDatabaseUrl.toString()
  })

  afterAll(async () => {
    const { closeDb } = await import("../client")
    await closeDb()
    process.env.DATABASE_URL = originalDatabaseUrl
    await maintenanceClient.unsafe(
      `drop database ${escapePostgresIdentifier(resetDatabaseName)}`
    )
    await maintenanceClient.end()
  })

  it("replaces existing catalogue and Collector data with generated demo data", async () => {
    const { coin, db, user } = await import("../index")
    const { resetAndSeedDatabase } = await import("./reset-and-seed-database")
    const createdAt = new Date("2026-07-27T12:00:00.000Z")

    await resetAndSeedDatabase()

    await db.insert(user).values({
      id: "staging-collector",
      name: "Staging Collector",
      email: "staging-collector@example.com",
      emailVerified: true,
      role: "admin",
      createdAt,
      updatedAt: createdAt,
    })

    await resetAndSeedDatabase()

    await expect(
      db.select({ count: count() }).from(user).where(eq(user.id, "staging-collector"))
    ).resolves.toEqual([{ count: 0 }])

    await expect(
      db.select({ count: count() }).from(user)
    ).resolves.toEqual([{ count: 0 }])

    await expect(
      db
        .select({ count: count() })
        .from(coin)
        .where(eq(coin.title, "Spain 2 Euro"))
    ).resolves.toEqual([{ count: 1 }])
  })
})
