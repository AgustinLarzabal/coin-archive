import { and, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { account, bootstrapInitialAdmin, db, user } from "../index"
import { useTestDatabaseIsolation } from "../testing/test-database"

const collectorCreatedAt = new Date("2026-07-27T12:00:00.000Z")

async function createCollector({
  email = "maintainer@example.com",
  id = "maintainer",
  role = "collector",
  hasGoogleAccount = true,
  emailVerified = true,
}: {
  email?: string
  id?: string
  role?: "admin" | "collector" | "editor"
  hasGoogleAccount?: boolean
  emailVerified?: boolean
} = {}) {
  await db.insert(user).values({
    id,
    name: "Maintainer",
    email,
    emailVerified,
    role,
    createdAt: collectorCreatedAt,
    updatedAt: collectorCreatedAt,
  })

  if (hasGoogleAccount) {
    await db.insert(account).values({
      id: `google-${id}`,
      userId: id,
      accountId: `google-account-${id}`,
      providerId: "google",
      createdAt: collectorCreatedAt,
      updatedAt: collectorCreatedAt,
    })
  }
}

describe("initial Admin bootstrap", () => {
  useTestDatabaseIsolation(db)

  it("promotes the configured Google-authenticated Collector after sign-in", async () => {
    await createCollector()

    await expect(
      bootstrapInitialAdmin({ configuredEmail: "MAINTAINER@example.com" })
    ).resolves.toEqual({
      status: "promoted",
      collectorId: "maintainer",
      email: "maintainer@example.com",
    })

    await expect(
      db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, "maintainer"))
    ).resolves.toEqual([{ role: "admin" }])
  })

  it("refuses a missing configured email", async () => {
    await createCollector()

    await expect(bootstrapInitialAdmin({ configuredEmail: undefined })).resolves.toEqual({
      status: "missing-configured-email",
    })
  })

  it("refuses an email that has not completed Google sign-in", async () => {
    await createCollector({ hasGoogleAccount: false })

    await expect(
      bootstrapInitialAdmin({ configuredEmail: "maintainer@example.com" })
    ).resolves.toEqual({
      status: "not-google-authenticated",
    })
  })

  it("refuses a configured email that does not match a Collector", async () => {
    await createCollector({ email: "other@example.com" })

    await expect(
      bootstrapInitialAdmin({ configuredEmail: "maintainer@example.com" })
    ).resolves.toEqual({ status: "collector-not-found" })
  })

  it("refuses a Collector that is no longer eligible for initial bootstrap", async () => {
    await createCollector({ role: "editor" })

    await expect(
      bootstrapInitialAdmin({ configuredEmail: "maintainer@example.com" })
    ).resolves.toEqual({ status: "collector-not-eligible" })
  })

  it("refuses a Google account whose Collector email is not verified", async () => {
    await createCollector({ emailVerified: false })

    await expect(
      bootstrapInitialAdmin({ configuredEmail: "maintainer@example.com" })
    ).resolves.toEqual({ status: "collector-not-eligible" })
  })

  it("refuses bootstrap after an Admin already exists", async () => {
    await createCollector({ id: "existing-admin", email: "admin@example.com", role: "admin" })
    await createCollector()

    await expect(
      bootstrapInitialAdmin({ configuredEmail: "maintainer@example.com" })
    ).resolves.toEqual({ status: "admin-already-exists" })

    await expect(
      db
        .select({ role: user.role })
        .from(user)
        .where(and(eq(user.id, "maintainer"), eq(user.role, "collector")))
    ).resolves.toEqual([{ role: "collector" }])
  })
})
