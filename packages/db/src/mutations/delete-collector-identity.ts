import { eq } from "drizzle-orm"

import { db } from "../client"
import { user } from "../schema/user"

type DeleteCollectorIdentityInput = {
  collectorId: string
}

export async function deleteCollectorIdentity({
  collectorId,
}: DeleteCollectorIdentityInput) {
  const [deletedCollector] = await db
    .delete(user)
    .where(eq(user.id, collectorId))
    .returning()

  return deletedCollector ?? null
}
