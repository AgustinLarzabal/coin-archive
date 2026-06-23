import { count, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { account, coin, db, session, user } from "../index"
import { deleteCollectorIdentity } from "./delete-collector-identity"
import { createCoin, createIssuer } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("deleteCollectorIdentity integration", () => {
  useTestDatabaseIsolation(db)

  it("allows an Editor to self-delete while preserving catalogue data", async () => {
    const createdIssuer = await createIssuer({
      code: "editor-delete-issuer",
      name: "Editor Delete Issuer",
    })

    await db.insert(user).values({
      id: "editor-1",
      name: "Editor One",
      email: "editor@example.com",
      emailVerified: true,
      role: "editor",
    })

    await db.insert(account).values({
      id: "account-editor-1",
      userId: "editor-1",
      accountId: "google-editor-1",
      providerId: "google",
    })

    await db.insert(session).values({
      id: "session-editor-1",
      userId: "editor-1",
      token: "session-editor-1",
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    })

    const createdCoin = await createCoin({
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
      issuerId: createdIssuer.id,
      title: "Editor Collector Deletion Test Coin",
    })

    await expect(
      deleteCollectorIdentity({
        collectorId: "editor-1",
      })
    ).resolves.toMatchObject({
      status: "deleted",
      collector: {
        id: "editor-1",
        role: "editor",
      },
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
      title: "Editor Collector Deletion Test Coin",
    })
  })

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
      status: "deleted",
      collector: {
        id: "collector-1",
        email: collectorEmail,
      },
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

  it("blocks Collector Deletion for the last persisted Admin", async () => {
    await db.insert(user).values({
      id: "admin-1",
      name: "Admin One",
      email: "admin-one@example.com",
      emailVerified: true,
      role: "admin",
    })

    await db.insert(account).values({
      id: "account-admin-1",
      userId: "admin-1",
      accountId: "google-admin-1",
      providerId: "google",
    })

    await db.insert(session).values({
      id: "session-admin-1",
      userId: "admin-1",
      token: "session-admin-1",
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    })

    await expect(
      deleteCollectorIdentity({
        collectorId: "admin-1",
      })
    ).resolves.toStrictEqual({
      status: "blocked-last-admin",
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

    expect(remainingCollectors?.count).toBe(1)
    expect(remainingAccounts?.count).toBe(1)
    expect(remainingSessions?.count).toBe(1)
  })

  it("allows an Admin to self-delete when another persisted Admin remains", async () => {
    const createdIssuer = await createIssuer({
      code: "admin-delete-issuer",
      name: "Admin Delete Issuer",
    })

    await db.insert(user).values([
      {
        id: "admin-1",
        name: "Admin One",
        email: "admin-one@example.com",
        emailVerified: true,
        role: "admin",
      },
      {
        id: "admin-2",
        name: "Admin Two",
        email: "admin-two@example.com",
        emailVerified: true,
        role: "admin",
      },
    ])

    await db.insert(account).values({
      id: "account-admin-1",
      userId: "admin-1",
      accountId: "google-admin-1",
      providerId: "google",
    })

    await db.insert(session).values({
      id: "session-admin-1",
      userId: "admin-1",
      token: "session-admin-1",
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    })

    const createdCoin = await createCoin({
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
      issuerId: createdIssuer.id,
      title: "Admin Collector Deletion Test Coin",
    })

    await expect(
      deleteCollectorIdentity({
        collectorId: "admin-1",
      })
    ).resolves.toMatchObject({
      status: "deleted",
      collector: {
        id: "admin-1",
        role: "admin",
      },
    })

    const remainingAdmins = await db
      .select()
      .from(user)
      .where(eq(user.role, "admin"))

    const remainingAccounts = (
      await db.select({ count: count() }).from(account)
    ).at(0)
    const remainingSessions = (
      await db.select({ count: count() }).from(session)
    ).at(0)
    const persistedCoin = (
      await db.select().from(coin).where(eq(coin.id, createdCoin.id))
    ).at(0)

    expect(remainingAdmins).toHaveLength(1)
    expect(remainingAdmins.at(0)?.id).toBe("admin-2")
    expect(remainingAccounts?.count).toBe(0)
    expect(remainingSessions?.count).toBe(0)
    expect(persistedCoin).toMatchObject({
      id: createdCoin.id,
      title: "Admin Collector Deletion Test Coin",
    })
  })

  it("returns null when the same Collector Deletion is requested again after success", async () => {
    await db.insert(user).values({
      id: "collector-1",
      name: "Collector One",
      email: "collector@example.com",
      emailVerified: true,
      role: "collector",
    })

    await expect(
      deleteCollectorIdentity({
        collectorId: "collector-1",
      })
    ).resolves.toMatchObject({
      status: "deleted",
      collector: {
        id: "collector-1",
      },
    })

    await expect(
      deleteCollectorIdentity({
        collectorId: "collector-1",
      })
    ).resolves.toBeNull()
  })
})
