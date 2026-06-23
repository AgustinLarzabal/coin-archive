import { count, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { account, coin, db, session, user } from "../index"
import { deleteCollectorIdentity } from "./delete-collector-identity"
import { createCoin, createIssuer } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

const collectorDeletionSessionExpiresAt = new Date("2027-01-01T00:00:00.000Z")

async function insertCollectorWithAuthRecords({
  collectorId,
  accountId,
  email,
  name,
  role,
}: {
  collectorId: string
  accountId: string
  email: string
  name: string
  role: "admin" | "collector" | "editor"
}) {
  await db.insert(user).values({
    id: collectorId,
    name,
    email,
    emailVerified: true,
    role,
  })

  await db.insert(account).values({
    id: `account-${collectorId}`,
    userId: collectorId,
    accountId,
    providerId: "google",
  })

  await db.insert(session).values({
    id: `session-${collectorId}`,
    userId: collectorId,
    token: `session-${collectorId}`,
    expiresAt: collectorDeletionSessionExpiresAt,
  })
}

async function createCatalogueCoinForDeletionTest({
  createdAt,
  issuerCode,
  issuerName,
  title,
}: {
  createdAt: Date
  issuerCode: string
  issuerName: string
  title: string
}) {
  const createdIssuer = await createIssuer({
    code: issuerCode,
    name: issuerName,
  })

  return createCoin({
    createdAt,
    issuerId: createdIssuer.id,
    title,
  })
}

async function selectTableCount(
  table: typeof user | typeof account | typeof session
) {
  return (await db.select({ count: count() }).from(table)).at(0)?.count ?? 0
}

async function expectCoinToRemain(coinId: string, title: string) {
  const persistedCoin = (
    await db.select().from(coin).where(eq(coin.id, coinId))
  ).at(0)

  expect(persistedCoin).toMatchObject({
    id: coinId,
    title,
  })
}

describe("deleteCollectorIdentity integration", () => {
  useTestDatabaseIsolation(db)

  it("allows an Editor to self-delete while preserving catalogue data", async () => {
    await insertCollectorWithAuthRecords({
      collectorId: "editor-1",
      accountId: "google-editor-1",
      email: "editor@example.com",
      name: "Editor One",
      role: "editor",
    })

    const createdCoin = await createCatalogueCoinForDeletionTest({
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
      issuerCode: "editor-delete-issuer",
      issuerName: "Editor Delete Issuer",
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

    expect(await selectTableCount(user)).toBe(0)
    expect(await selectTableCount(account)).toBe(0)
    expect(await selectTableCount(session)).toBe(0)
    await expectCoinToRemain(
      createdCoin.id,
      "Editor Collector Deletion Test Coin"
    )
  })

  it("removes the Collector identity plus linked auth records while preserving catalogue data and allowing a fresh Collector later", async () => {
    const collectorEmail = "collector@example.com"
    await insertCollectorWithAuthRecords({
      collectorId: "collector-1",
      accountId: "google-account-1",
      email: collectorEmail,
      name: "Collector One",
      role: "collector",
    })

    const createdCoin = await createCatalogueCoinForDeletionTest({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      issuerCode: "collector-delete-issuer",
      issuerName: "Collector Delete Issuer",
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

    expect(await selectTableCount(user)).toBe(0)
    expect(await selectTableCount(account)).toBe(0)
    expect(await selectTableCount(session)).toBe(0)
    await expectCoinToRemain(createdCoin.id, "Collector Deletion Test Coin")

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
    await insertCollectorWithAuthRecords({
      collectorId: "admin-1",
      accountId: "google-admin-1",
      email: "admin-one@example.com",
      name: "Admin One",
      role: "admin",
    })

    await expect(
      deleteCollectorIdentity({
        collectorId: "admin-1",
      })
    ).resolves.toStrictEqual({
      status: "blocked-last-admin",
    })

    expect(await selectTableCount(user)).toBe(1)
    expect(await selectTableCount(account)).toBe(1)
    expect(await selectTableCount(session)).toBe(1)
  })

  it("allows an Admin to self-delete when another persisted Admin remains", async () => {
    await insertCollectorWithAuthRecords({
      collectorId: "admin-1",
      accountId: "google-admin-1",
      email: "admin-one@example.com",
      name: "Admin One",
      role: "admin",
    })

    await db.insert(user).values({
      id: "admin-2",
      name: "Admin Two",
      email: "admin-two@example.com",
      emailVerified: true,
      role: "admin",
    })

    const createdCoin = await createCatalogueCoinForDeletionTest({
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
      issuerCode: "admin-delete-issuer",
      issuerName: "Admin Delete Issuer",
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

    expect(remainingAdmins).toHaveLength(1)
    expect(remainingAdmins.at(0)?.id).toBe("admin-2")
    expect(remainingAccounts?.count).toBe(0)
    expect(remainingSessions?.count).toBe(0)
    await expectCoinToRemain(
      createdCoin.id,
      "Admin Collector Deletion Test Coin"
    )
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
