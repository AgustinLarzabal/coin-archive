import { count, eq } from "drizzle-orm"

import { db } from "../client"
import { user } from "../schema/user"

type DeleteCollectorIdentityInput = {
  collectorId: string
}

export type DeleteCollectorIdentityResult =
  | {
      status: "deleted"
      collector: typeof user.$inferSelect
    }
  | {
      status: "blocked-last-admin"
    }

export async function deleteCollectorIdentity({
  collectorId,
}: DeleteCollectorIdentityInput) {
  return db.transaction(async (tx) => {
    const existingCollector = (
      await tx.select().from(user).where(eq(user.id, collectorId)).limit(1)
    ).at(0)

    if (!existingCollector) {
      return null
    }

    if (existingCollector.role === "admin") {
      const adminCount = (
        await tx
          .select({ count: count() })
          .from(user)
          .where(eq(user.role, "admin"))
      ).at(0)?.count

      if ((adminCount ?? 0) <= 1) {
        return {
          status: "blocked-last-admin",
        } satisfies DeleteCollectorIdentityResult
      }
    }

    const deletedCollector = (
      await tx.delete(user).where(eq(user.id, collectorId)).returning()
    ).at(0)

    if (!deletedCollector) {
      return null
    }

    return {
      status: "deleted",
      collector: deletedCollector,
    } satisfies DeleteCollectorIdentityResult
  })
}
