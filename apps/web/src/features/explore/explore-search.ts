import {
  COIN_LIST_DEFAULT_PAGE,
  coinListPageQuerySchema,
  coinListPageSchema,
  coinListYearQuerySchema,
  coinListYearSchema,
  engraverSlugSchema,
  issuerCodeSchema,
} from "@workspace/api"
import { z } from "zod"
import type { CoinListFilters } from "@/data/archive"

export const exploreSearchSchema = z.object({
  engraver: engraverSlugSchema.optional().catch(undefined),
  issuer: issuerCodeSchema.optional().catch(undefined),
  page: z
    .union([coinListPageSchema, coinListPageQuerySchema])
    .optional()
    .catch(undefined),
  year: z
    .union([coinListYearSchema, coinListYearQuerySchema])
    .optional()
    .catch(undefined),
})

export type ExploreSearch = z.infer<typeof exploreSearchSchema>

export function getExploreCoinListFilters(
  search: ExploreSearch
): CoinListFilters {
  return {
    engraverSlug: search.engraver,
    issuerCode: search.issuer,
    issueYear: search.year,
    page: search.page ?? COIN_LIST_DEFAULT_PAGE,
  }
}
