import {
  COIN_LIST_DEFAULT_PAGE,
  COIN_LIST_DEFAULT_PAGE_SIZE,
  coinListPageSchema,
  coinListResponseSchema,
  coinListSizeSchema,
  coinListThicknessSchema,
  coinListWeightSchema,
  coinListYearSchema,
  faceValueAmountQuerySchema,
  issuerCodeSchema,
  slugSchema,
} from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import type {
  CoinListResponse,
  CoinListSize,
  CoinListThickness,
  CoinListWeight,
  CoinListYear,
} from "@coin-archive/api"

import { API_BASE_URL } from "@/config"

class CoinListRequestError extends Error {}
export class InvalidCoinListFilterError extends Error {}
export class InvalidCoinListResponseError extends Error {}

export type CoinListFilters = Readonly<{
  composition?: string
  currencySlug?: string
  distribution?: string
  engraverSlug?: string
  faceValueAmount?: string
  issuerCode?: string
  issueYear?: CoinListYear
  mintSlug?: string
  orientation?: string
  rulingAuthoritySlug?: string
  shape?: string
  size?: CoinListSize
  tagSlugs?: string[]
  tagMatch?: "any"
  technique?: string
  thickness?: CoinListThickness
  weight?: CoinListWeight
  page?: number
}>

type ValidatedCoinListFilters = CoinListFilters & Readonly<{ page: number }>

async function getCoins({
  composition,
  currencySlug,
  distribution,
  engraverSlug,
  faceValueAmount,
  issuerCode,
  issueYear,
  mintSlug,
  orientation,
  rulingAuthoritySlug,
  shape,
  size,
  tagSlugs,
  tagMatch,
  technique,
  thickness,
  weight,
  page,
}: ValidatedCoinListFilters): Promise<CoinListResponse> {
  let response: Response

  try {
    const search = new URLSearchParams()

    if (composition !== undefined) search.set("composition", composition)
    if (currencySlug !== undefined) search.set("currency", currencySlug)
    if (distribution !== undefined) search.set("distribution", distribution)
    if (engraverSlug !== undefined) search.set("engraver", engraverSlug)
    if (faceValueAmount !== undefined) search.set("amount", faceValueAmount)
    if (issuerCode !== undefined) search.set("issuer", issuerCode)
    if (issueYear !== undefined) search.set("year", String(issueYear))
    if (mintSlug !== undefined) search.set("mint", mintSlug)
    if (orientation !== undefined) search.set("orientation", orientation)
    if (rulingAuthoritySlug !== undefined)
      search.set("ruler", rulingAuthoritySlug)
    if (shape !== undefined) search.set("shape", shape)
    if (size !== undefined) search.set("size", size)
    tagSlugs?.forEach((slug) => search.append("tag", slug))
    if (tagMatch !== undefined) search.set("tagMatch", tagMatch)
    if (technique !== undefined) search.set("technique", technique)
    if (thickness !== undefined) search.set("thickness", thickness)
    if (weight !== undefined) search.set("weight", weight)

    search.set("page", String(page))
    search.set("pageSize", String(COIN_LIST_DEFAULT_PAGE_SIZE))

    const query = search.size === 0 ? "" : `?${search.toString()}`
    response = await fetch(`${API_BASE_URL}/v1/coins${query}`)
  } catch (error) {
    throw new CoinListRequestError("Coin list request failed", {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new CoinListRequestError(
      `Coin list request failed with HTTP ${response.status}`
    )
  }

  try {
    return coinListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidCoinListResponseError("Coin list response is invalid", {
      cause: error,
    })
  }
}

function validateCoinListFilters(
  filters: CoinListFilters
): ValidatedCoinListFilters {
  const {
    composition,
    currencySlug,
    distribution,
    engraverSlug,
    faceValueAmount,
    issuerCode,
    issueYear,
    mintSlug,
    orientation,
    rulingAuthoritySlug,
    shape,
    size,
    tagSlugs,
    tagMatch,
    technique,
    thickness,
    weight,
    page = COIN_LIST_DEFAULT_PAGE,
  } = filters

  if (composition !== undefined && !slugSchema.safeParse(composition).success) {
    throw new InvalidCoinListFilterError("Invalid Coin Composition")
  }

  if (
    currencySlug !== undefined &&
    !slugSchema.safeParse(currencySlug).success
  ) {
    throw new InvalidCoinListFilterError("Invalid Currency Slug")
  }

  if (
    distribution !== undefined &&
    !slugSchema.safeParse(distribution).success
  ) {
    throw new InvalidCoinListFilterError("Invalid Coin Distribution")
  }

  if (
    engraverSlug !== undefined &&
    !slugSchema.safeParse(engraverSlug).success
  ) {
    throw new InvalidCoinListFilterError("Invalid Engraver Slug")
  }

  if (
    faceValueAmount !== undefined &&
    (currencySlug === undefined ||
      !faceValueAmountQuerySchema.safeParse(faceValueAmount).success)
  ) {
    throw new InvalidCoinListFilterError("Invalid Face Value Amount")
  }

  if (
    issuerCode !== undefined &&
    !issuerCodeSchema.safeParse(issuerCode).success
  ) {
    throw new InvalidCoinListFilterError("Invalid issuer Code")
  }

  if (
    issueYear !== undefined &&
    !coinListYearSchema.safeParse(issueYear).success
  ) {
    throw new InvalidCoinListFilterError("Invalid Issue Year")
  }

  if (mintSlug !== undefined && !slugSchema.safeParse(mintSlug).success) {
    throw new InvalidCoinListFilterError("Invalid Mint Slug")
  }

  if (orientation !== undefined && !slugSchema.safeParse(orientation).success) {
    throw new InvalidCoinListFilterError("Invalid Coin Orientation")
  }

  if (
    rulingAuthoritySlug !== undefined &&
    !slugSchema.safeParse(rulingAuthoritySlug).success
  ) {
    throw new InvalidCoinListFilterError("Invalid Ruling Authority Slug")
  }

  if (shape !== undefined && !slugSchema.safeParse(shape).success) {
    throw new InvalidCoinListFilterError("Invalid Coin Shape")
  }

  if (size !== undefined && !coinListSizeSchema.safeParse(size).success) {
    throw new InvalidCoinListFilterError("Invalid Coin Size")
  }

  if (
    tagSlugs !== undefined &&
    (tagSlugs.length === 0 ||
      tagSlugs.some((slug) => !slugSchema.safeParse(slug).success) ||
      new Set(tagSlugs).size !== tagSlugs.length)
  ) {
    throw new InvalidCoinListFilterError("Invalid Tag Slugs")
  }

  if (tagMatch !== undefined && tagSlugs === undefined) {
    throw new InvalidCoinListFilterError("Invalid Tag Match")
  }

  if (technique !== undefined && !slugSchema.safeParse(technique).success) {
    throw new InvalidCoinListFilterError("Invalid Coin Technique")
  }

  if (
    thickness !== undefined &&
    !coinListThicknessSchema.safeParse(thickness).success
  ) {
    throw new InvalidCoinListFilterError("Invalid Coin Thickness")
  }

  if (weight !== undefined && !coinListWeightSchema.safeParse(weight).success) {
    throw new InvalidCoinListFilterError("Invalid Coin Weight")
  }

  if (!coinListPageSchema.safeParse(page).success) {
    throw new InvalidCoinListFilterError("Invalid Coin List Page")
  }

  return {
    ...filters,
    page,
  }
}

export function coinListQueryOptions(filters: CoinListFilters = {}) {
  const validatedFilters = validateCoinListFilters(filters)

  return queryOptions({
    queryKey: ["coins", "list", validatedFilters] as const,
    queryFn: () => getCoins(validatedFilters),
    staleTime: 30_000,
  })
}
