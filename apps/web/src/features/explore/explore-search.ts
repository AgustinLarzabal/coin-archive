import {
  COIN_LIST_DEFAULT_PAGE,
  coinDistributionSchema,
  coinListPageQuerySchema,
  coinListPageSchema,
  coinListYearQuerySchema,
  coinListYearSchema,
  currencySlugSchema,
  engraverSlugSchema,
  faceValueAmountQuerySchema,
  issuerCodeSchema,
  rulingAuthoritySlugSchema,
} from "@coin-archive/api"
import { z } from "zod"
import type { CoinListFilters } from "@/data/archive"

const exploreSearchObjectSchema = z.object({
  amount: faceValueAmountQuerySchema.optional().catch(undefined),
  currency: currencySlugSchema.optional().catch(undefined),
  distribution: coinDistributionSchema.optional().catch(undefined),
  engraver: engraverSlugSchema.optional().catch(undefined),
  issuer: issuerCodeSchema.optional().catch(undefined),
  page: z
    .union([coinListPageSchema, coinListPageQuerySchema])
    .optional()
    .catch(undefined),
  ruler: rulingAuthoritySlugSchema.optional().catch(undefined),
  year: z
    .union([coinListYearSchema, coinListYearQuerySchema])
    .optional()
    .catch(undefined),
})

export const exploreSearchSchema = exploreSearchObjectSchema.transform(
  (search): z.infer<typeof exploreSearchObjectSchema> => ({
    ...search,
    amount: search.currency === undefined ? undefined : search.amount,
  })
)

export type ExploreSearch = z.infer<typeof exploreSearchSchema>

export function getExploreCoinListFilters(
  search: ExploreSearch
): CoinListFilters {
  return {
    currencySlug: search.currency,
    faceValueAmount: search.amount,
    distribution: search.distribution,
    engraverSlug: search.engraver,
    issuerCode: search.issuer,
    issueYear: search.year,
    page: search.page ?? COIN_LIST_DEFAULT_PAGE,
    rulingAuthoritySlug: search.ruler,
  }
}
