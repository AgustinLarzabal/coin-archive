import {
  COIN_LIST_DEFAULT_PAGE,
  coinListPageQuerySchema,
  coinListPageSchema,
  coinListSizeSchema,
  coinListThicknessSchema,
  coinListWeightSchema,
  coinListYearQuerySchema,
  coinListYearSchema,
  compositionSlugSchema,
  currencySlugSchema,
  distributionSlugSchema,
  engraverSlugSchema,
  faceValueAmountQuerySchema,
  issuerCodeSchema,
  mintSlugSchema,
  orientationSlugSchema,
  rulingAuthoritySlugSchema,
  shapeSlugSchema,
  tagSlugSchema,
  techniqueSlugSchema,
} from "@coin-archive/api"
import { z } from "zod"
import type { CoinListFilters } from "@/data/archive"

export const exploreSearchSchema = z.object({
  amount: faceValueAmountQuerySchema.optional().catch(undefined),
  composition: compositionSlugSchema.optional().catch(undefined),
  currency: currencySlugSchema.optional().catch(undefined),
  distribution: distributionSlugSchema.optional().catch(undefined),
  engraver: engraverSlugSchema.optional().catch(undefined),
  issuer: issuerCodeSchema.optional().catch(undefined),
  mint: mintSlugSchema.optional().catch(undefined),
  orientation: orientationSlugSchema.optional().catch(undefined),
  ruler: rulingAuthoritySlugSchema.optional().catch(undefined),
  shape: shapeSlugSchema.optional().catch(undefined),
  size: coinListSizeSchema.optional().catch(undefined),
  tag: tagSlugSchema.optional().catch(undefined),
  technique: techniqueSlugSchema.optional().catch(undefined),
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
    technique: search.technique,
    tagSlug: search.tag,
    composition: search.composition,
    shape: search.shape,
    ...(search.orientation === undefined
      ? {}
      : { orientation: search.orientation }),
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
