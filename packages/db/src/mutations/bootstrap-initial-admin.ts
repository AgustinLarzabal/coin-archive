import { and, eq, sql } from "drizzle-orm"

import { db } from "../client"
import { account } from "../schema/account"
import { user } from "../schema/user"

const initialAdminBootstrapAdvisoryLock = 229

type BootstrapInitialAdminInput = {
  configuredEmail: string | undefined
}

export type BootstrapInitialAdminResult =
  | { status: "missing-configured-email" }
  | { status: "collector-not-found" }
  | { status: "not-google-authenticated" }
  | { status: "collector-not-eligible" }
  | { status: "admin-already-exists" }
  | { status: "promoted"; collectorId: string; email: string }

export async function bootstrapInitialAdmin({
  configuredEmail,
}: BootstrapInitialAdminInput): Promise<BootstrapInitialAdminResult> {
  const normalizedConfiguredEmail = configuredEmail?.trim().toLowerCase()

  if (!normalizedConfiguredEmail) {
    return { status: "missing-configured-email" }
  }

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${initialAdminBootstrapAdvisoryLock})`
    )

    const collector = (
      await tx
        .select()
        .from(user)
        .where(sql`lower(${user.email}) = ${normalizedConfiguredEmail}`)
        .limit(1)
    ).at(0)

    if (!collector) {
      return { status: "collector-not-found" }
    }

    const googleAccount = (
      await tx
        .select({ id: account.id })
        .from(account)
        .where(
          and(eq(account.userId, collector.id), eq(account.providerId, "google"))
        )
        .limit(1)
    ).at(0)

    if (!googleAccount) {
      return { status: "not-google-authenticated" }
    }

    if (collector.role !== "collector" || !collector.emailVerified) {
      return { status: "collector-not-eligible" }
    }

    const existingAdmin = (
      await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.role, "admin"))
        .limit(1)
    ).at(0)

    if (existingAdmin) {
      return { status: "admin-already-exists" }
    }

    await tx
      .update(user)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(user.id, collector.id))

    return {
      status: "promoted",
      collectorId: collector.id,
      email: collector.email,
    }
  })
}
