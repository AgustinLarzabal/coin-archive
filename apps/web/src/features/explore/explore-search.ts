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
  measurementMinExceedsMax,
  measurementQuerySchema,
  mintSlugSchema,
  rulingAuthoritySlugSchema,
} from "@coin-archive/api"
import { z } from "zod"
import type { CoinListFilters } from "@/data/archive"

const exploreSearchObjectSchema = z.object({
  sizeMin: measurementQuerySchema(2).optional().catch(undefined),
  sizeMax: measurementQuerySchema(2).optional().catch(undefined),
  thicknessMin: measurementQuerySchema(2).optional().catch(undefined),
  thicknessMax: measurementQuerySchema(2).optional().catch(undefined),
  weightMin: measurementQuerySchema(3).optional().catch(undefined),
  weightMax: measurementQuerySchema(3).optional().catch(undefined),
  amount: faceValueAmountQuerySchema.optional().catch(undefined),
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

export const exploreSearchSchema = exploreSearchObjectSchema.transform(
  (search): z.infer<typeof exploreSearchObjectSchema> => {
    const valid = {
      ...search,
      amount: search.currency === undefined ? undefined : search.amount,
    }
    for (const name of ["size", "thickness", "weight"] as const) {
      const minKey = `${name}Min` as const
      const maxKey = `${name}Max` as const
      if (
        valid[minKey] !== undefined &&
        valid[maxKey] !== undefined &&
        measurementMinExceedsMax(valid[minKey], valid[maxKey])
      ) {
        valid[maxKey] = undefined
      }
    }
    return valid
  }
)

export type ExploreSearch = z.infer<typeof exploreSearchSchema>

export function getExploreCoinListFilters(
  search: ExploreSearch
): CoinListFilters {
  return {
    sizeMin: search.sizeMin,
    sizeMax: search.sizeMax,
    thicknessMin: search.thicknessMin,
    thicknessMax: search.thicknessMax,
    weightMin: search.weightMin,
    weightMax: search.weightMax,
    currencySlug: search.currency,
    faceValueAmount: search.amount,
    distribution: search.distribution,
    engraverSlug: search.engraver,
    issuerCode: search.issuer,
    mintSlug: search.mint,
    issueYear: search.year,
    page: search.page ?? COIN_LIST_DEFAULT_PAGE,
    rulingAuthoritySlug: search.ruler,
  }
}
