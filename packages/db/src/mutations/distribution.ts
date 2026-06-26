import { db } from "../client"
import { distribution } from "../schema/distribution"
import type { Distribution } from "../schema/distribution"

type DistributionFields = {
  code: string
  name: string
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
