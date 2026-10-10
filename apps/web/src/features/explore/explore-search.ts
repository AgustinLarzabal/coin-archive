import { issuerCodeSchema } from "@workspace/api"
import { z } from "zod"
import type { CoinListFilters } from "@/data/archive"

export const exploreSearchSchema = z.object({
  issuer: issuerCodeSchema.optional().catch(undefined),
})

export type ExploreSearch = z.infer<typeof exploreSearchSchema>

export function getExploreCoinListFilters(
  search: ExploreSearch
): CoinListFilters {
  return { issuerCode: search.issuer }
}
