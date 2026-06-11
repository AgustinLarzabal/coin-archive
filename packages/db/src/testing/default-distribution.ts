import { distribution, type Distribution } from "../schema/distribution"
import { getOrCreateDefaultEntity } from "./default-entity"

type Database = typeof import("../client").db

export const defaultDistributionValues = {
  code: "standard-circulation",
  name: "Standard circulation",
} as const

export async function getOrCreateDefaultDistribution(
  database: Database
): Promise<Distribution> {
  return getOrCreateDefaultEntity(
    database,
    distribution,
    distribution.code,
    defaultDistributionValues
  )
}
