import { eq } from "drizzle-orm"
import { distribution, type Distribution } from "../schema/distribution"

type Database = typeof import("../client").db

export const defaultDistributionValues = {
  code: "standard-circulation",
  name: "Standard circulation",
} as const

export async function getOrCreateDefaultDistribution(
  database: Database
): Promise<Distribution> {
  const [existingDistribution] = await database
    .select()
    .from(distribution)
    .where(eq(distribution.code, defaultDistributionValues.code))
    .limit(1)

  if (existingDistribution) {
    return existingDistribution
  }

  const [createdDistribution] = await database
    .insert(distribution)
    .values(defaultDistributionValues)
    .returning()

  return createdDistribution
}
