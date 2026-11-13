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

const lowerSlug = z.preprocess(
  (value) =>
    typeof value === "string"
      ? value.replace(/[A-Z]/g, (letter) => letter.toLowerCase())
      : value,
  slugSchema
)
const upperIssuerCode = z.preprocess(
  (value) =>
    typeof value === "string"
      ? value.replace(/[a-z]/g, (letter) => letter.toUpperCase())
      : value,
  issuerCodeSchema
)

export const exploreSearchSchema = z.object({
  amount: faceValueAmountQuerySchema.optional().catch(undefined),
  composition: lowerSlug.optional().catch(undefined),
  currency: lowerSlug.optional().catch(undefined),
  distribution: lowerSlug.optional().catch(undefined),
  engraver: lowerSlug.optional().catch(undefined),
  issuer: upperIssuerCode.optional().catch(undefined),
  mint: lowerSlug.optional().catch(undefined),
  orientation: lowerSlug.optional().catch(undefined),
  ruler: lowerSlug.optional().catch(undefined),
  shape: lowerSlug.optional().catch(undefined),
  size: coinListSizeSchema.optional().catch(undefined),
  tag: z
    .union([lowerSlug, z.array(lowerSlug).min(1)])
    .transform((value) => {
      if (!Array.isArray(value)) return value
      const tags = [...new Set(value)]
      return tags.length === 1 ? tags[0] : tags
    })
    .optional()
    .catch(undefined),
  tagMatch: z
    .preprocess(
      (value) => (typeof value === "string" ? value.toLowerCase() : value),
      z.enum(["all", "any"])
    )
    .optional()
    .catch(undefined),
  technique: lowerSlug.optional().catch(undefined),
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

const textFilters = [
  "composition",
  "currency",
  "distribution",
  "engraver",
  "issuer",
  "mint",
  "orientation",
  "ruler",
  "shape",
  "tag",
  "tagMatch",
  "technique",
] as const

export function canonicalExploreHref(
  search: ExploreSearch,
  location: { pathname: string; searchStr: string; hash: string }
) {
  const canonical = new URLSearchParams(location.searchStr)
  let changed = false
  for (const key of textFilters) {
    const value = search[key]
    if (value === undefined) continue
    const values = Array.isArray(value) ? value : [value]
    const rawValues = canonical.getAll(key)
    if (
      rawValues.length === values.length &&
      rawValues.every((raw, index) => raw === values[index])
    )
      continue
    canonical.delete(key)
    values.forEach((item) => canonical.append(key, item))
    changed = true
  }
  return changed
    ? `${location.pathname}?${canonical.toString()}${location.hash}`
    : null
}

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
    ...(search.tag !== undefined && search.tagMatch !== undefined
      ? { tagMatch: search.tagMatch }
      : {}),
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
