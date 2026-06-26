import { eq } from "drizzle-orm"

import { db } from "../client"
import { distribution } from "../schema/distribution"
import type { Distribution } from "../schema/distribution"

type DistributionFields = {
  code: string
  name: string
}

type UpdateDistributionInput = DistributionFields & {
  id: string
}

function normalizeDistributionFields({ code, name }: DistributionFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createDistribution(
  fields: DistributionFields
): Promise<Distribution> {
  const [createdDistribution] = await db
    .insert(distribution)
    .values(normalizeDistributionFields(fields))
    .returning()

  return createdDistribution
}

export async function updateDistribution({
  id,
  ...fields
}: UpdateDistributionInput): Promise<Distribution | null> {
  const [updatedDistribution] = await db
    .update(distribution)
    .set({
      ...normalizeDistributionFields(fields),
      updatedAt: new Date(),
    })
    .where(eq(distribution.id, id))
    .returning()

  return updatedDistribution ?? null
}
