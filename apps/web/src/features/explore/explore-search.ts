import {
  COIN_LIST_DEFAULT_PAGE,
  coinListPageQuerySchema,
  coinListPageSchema,
  coinListSizeSchema,
  coinListThicknessSchema,
  coinListWeightSchema,
  coinListYearQuerySchema,
  coinListYearSchema,
  faceValueAmountQuerySchema,
  issuerCodeSchema,
  slugSchema,
} from "@coin-archive/api"
import { z } from "zod"
import type { CoinListFilters } from "@/data/archive"

export const exploreSearchSchema = z.object({
  amount: faceValueAmountQuerySchema.optional().catch(undefined),
  composition: slugSchema.optional().catch(undefined),
  currency: slugSchema.optional().catch(undefined),
  distribution: slugSchema.optional().catch(undefined),
  engraver: slugSchema.optional().catch(undefined),
  issuer: issuerCodeSchema.optional().catch(undefined),
  mint: slugSchema.optional().catch(undefined),
  orientation: slugSchema.optional().catch(undefined),
  ruler: slugSchema.optional().catch(undefined),
  shape: slugSchema.optional().catch(undefined),
  size: coinListSizeSchema.optional().catch(undefined),
  tag: z
    .union([slugSchema, z.array(slugSchema).min(1)])
    .optional()
    .catch(undefined),
  technique: slugSchema.optional().catch(undefined),
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
    tagSlugs:
      search.tag === undefined
        ? undefined
        : Array.isArray(search.tag)
          ? search.tag
          : [search.tag],
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
