import { count, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { account, coin, db, session, user } from "../index"
import { deleteCollectorIdentity } from "./delete-collector-identity"
import { createCoin, createIssuer } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("deleteCollectorIdentity integration", () => {
  useTestDatabaseIsolation(db)

  it("removes the Collector identity plus linked auth records while preserving catalogue data and allowing a fresh Collector later", async () => {
    const collectorEmail = "collector@example.com"
    const createdIssuer = await createIssuer({
      code: "collector-delete-issuer",
      name: "Collector Delete Issuer",
    })

    await db.insert(user).values({
      id: "collector-1",
      name: "Collector One",
      email: collectorEmail,
      emailVerified: true,
      role: "collector",
    })

    await db.insert(account).values({
      id: "account-1",
      userId: "collector-1",
      accountId: "google-account-1",
      providerId: "google",
    })

    await db.insert(session).values({
      id: "session-1",
      userId: "collector-1",
      token: "session-token-1",
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    })

    const createdCoin = await createCoin({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      issuerId: createdIssuer.id,
      title: "Collector Deletion Test Coin",
    })

    await expect(
      deleteCollectorIdentity({
        collectorId: "collector-1",
      })
    ).resolves.toMatchObject({
      id: "collector-1",
      email: collectorEmail,
    })

    const remainingCollectors = (
      await db.select({ count: count() }).from(user)
    ).at(0)
    const remainingAccounts = (
      await db.select({ count: count() }).from(account)
    ).at(0)
    const remainingSessions = (
      await db.select({ count: count() }).from(session)
    ).at(0)
    const persistedCoin = (
      await db.select().from(coin).where(eq(coin.id, createdCoin.id))
    ).at(0)

    expect(remainingCollectors?.count).toBe(0)
    expect(remainingAccounts?.count).toBe(0)
    expect(remainingSessions?.count).toBe(0)
    expect(persistedCoin).toMatchObject({
      id: createdCoin.id,
      title: "Collector Deletion Test Coin",
    })

    const [recreatedCollector] = await db
      .insert(user)
      .values({
        id: "collector-2",
        name: "Collector Two",
        email: collectorEmail,
        emailVerified: true,
      })
      .returning()

    expect(recreatedCollector.role).toBe("collector")
  })
})
