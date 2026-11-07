import {
  COIN_LIST_DEFAULT_PAGE,
  coinDistributionSchema,
  coinListPageQuerySchema,
  coinListPageSchema,
  coinListSizeSchema,
  coinListThicknessSchema,
  coinListWeightSchema,
  coinListYearQuerySchema,
  coinListYearSchema,
  compositionSlugSchema,
  currencySlugSchema,
  engraverSlugSchema,
  faceValueAmountQuerySchema,
  issuerCodeSchema,
  mintSlugSchema,
  rulingAuthoritySlugSchema,
} from "@coin-archive/api"
import { z } from "zod"
import type { CoinListFilters } from "@/data/archive"

export const exploreSearchSchema = z.object({
  amount: faceValueAmountQuerySchema.optional().catch(undefined),
  currency: currencySlugSchema.optional().catch(undefined),
  distribution: coinDistributionSchema.optional().catch(undefined),
  composition: compositionSlugSchema.optional().catch(undefined),
  engraver: engraverSlugSchema.optional().catch(undefined),
  issuer: issuerCodeSchema.optional().catch(undefined),
  mint: mintSlugSchema.optional().catch(undefined),
  ruler: rulingAuthoritySlugSchema.optional().catch(undefined),
  size: coinListSizeSchema.optional().catch(undefined),
  thickness: coinListThicknessSchema.optional().catch(undefined),
  weight: coinListWeightSchema.optional().catch(undefined),
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
    faceValueAmount: search.currency === undefined ? undefined : search.amount,
    distribution: search.distribution,
    composition: search.composition,
    engraverSlug: search.engraver,
    issuerCode: search.issuer,
    mintSlug: search.mint,
    rulingAuthoritySlug: search.ruler,
    size: search.size,
    thickness: search.thickness,
    weight: search.weight,
    issueYear: search.year,
    page: search.page ?? COIN_LIST_DEFAULT_PAGE,
  }
}
