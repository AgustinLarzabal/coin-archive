import {
  COIN_LIST_DEFAULT_PAGE,
  coinDistributionSchema,
  coinListPageQuerySchema,
  coinListPageSchema,
  coinListYearQuerySchema,
  coinListYearSchema,
  currencySlugSchema,
  engraverSlugSchema,
  issuerCodeSchema,
  mintSlugSchema,
  rulingAuthoritySlugSchema,
} from "@coin-archive/api"
import { z } from "zod"
import type { CoinListFilters } from "@/data/archive"

export const exploreSearchSchema = z.object({
  currency: currencySlugSchema.optional().catch(undefined),
  distribution: coinDistributionSchema.optional().catch(undefined),
  engraver: engraverSlugSchema.optional().catch(undefined),
  issuer: issuerCodeSchema.optional().catch(undefined),
  mint: mintSlugSchema.optional().catch(undefined),
  ruler: rulingAuthoritySlugSchema.optional().catch(undefined),
  year: z
    .union([coinListYearSchema, coinListYearQuerySchema])
    .optional()
    .catch(undefined),
  page: z
    .union([coinListPageSchema, coinListPageQuerySchema])
    .optional()
    .catch(undefined),
})

export type ExploreSearch = z.infer<typeof exploreSearchSchema>

export function getExploreCoinListFilters(
  search: ExploreSearch
): CoinListFilters {
  return {
    currencySlug: search.currency,
    distribution: search.distribution,
    engraverSlug: search.engraver,
    issuerCode: search.issuer,
    mintSlug: search.mint,
    rulingAuthoritySlug: search.ruler,
    issueYear: search.year,
    page: search.page ?? COIN_LIST_DEFAULT_PAGE,
  }
}
