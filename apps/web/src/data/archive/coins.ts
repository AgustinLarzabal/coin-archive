import { queryOptions } from "@tanstack/react-query"
import {
  COIN_LIST_DEFAULT_PAGE,
  COIN_LIST_DEFAULT_PAGE_SIZE,
  coinDetailResponseSchema,
  coinDistributionSchema,
  coinIdSchema,
  coinListPageSchema,
  coinListResponseSchema,
  coinListYearSchema,
  coinNotFoundErrorSchema,
  engraverSlugSchema,
  issuerCodeSchema,
  rulingAuthoritySlugSchema,
} from "@workspace/api"
import type {
  CoinDetailResponse,
  CoinDistribution,
  CoinListResponse,
  CoinListYear,
} from "@workspace/api"

import { API_BASE_URL } from "@/config"

export class CoinNotFoundError extends Error {}
export class InvalidCoinResponseError extends Error {}
class CoinRequestError extends Error {}
export class InvalidCoinListResponseError extends Error {}
class CoinListRequestError extends Error {}
export class InvalidCoinIdError extends Error {}
export class InvalidIssuerCodeError extends Error {}
export class InvalidEngraverSlugError extends Error {}
export class InvalidRulingAuthoritySlugError extends Error {}
export class InvalidIssueYearError extends Error {}

export type CoinListFilters = Readonly<{
  distribution?: CoinDistribution
  engraverSlug?: string
  issuerCode?: string
  issueYear?: CoinListYear
  page?: number
  rulingAuthoritySlug?: string
}>

type ValidatedCoinListFilters = Readonly<{
  distribution?: CoinDistribution
  engraverSlug: string | null
  issuerCode: string | null
  issueYear?: CoinListYear
  page: number
  pageSize: number
  rulingAuthoritySlug?: string
}>

async function getCoins({
  distribution,
  engraverSlug,
  issuerCode,
  issueYear,
  page,
  pageSize,
  rulingAuthoritySlug,
}: ValidatedCoinListFilters): Promise<CoinListResponse> {
  let response: Response

  try {
    const search = new URLSearchParams()
    if (distribution !== undefined) {
      search.set("distribution", distribution)
    }
    if (issuerCode !== null) {
      search.set("issuer", issuerCode)
    }
    if (engraverSlug !== null) {
      search.set("engraver", engraverSlug)
    }
    if (rulingAuthoritySlug !== undefined) {
      search.set("ruler", rulingAuthoritySlug)
    }
    if (issueYear !== undefined) {
      search.set("year", String(issueYear))
    }
    search.set("page", String(page))
    search.set("pageSize", String(pageSize))
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

async function getCoin(coinId: string): Promise<CoinDetailResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/v1/coins/${coinId}`)
  } catch (error) {
    throw new CoinRequestError("Coin request failed", { cause: error })
  }

  if (response.status === 404) {
    try {
      coinNotFoundErrorSchema.parse(await response.json())
    } catch (error) {
      throw new InvalidCoinResponseError("Coin response is invalid", {
        cause: error,
      })
    }
    throw new CoinNotFoundError("Coin not found")
  }
  if (!response.ok) {
    throw new CoinRequestError(
      `Coin request failed with HTTP ${response.status}`
    )
  }

  try {
    return coinDetailResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidCoinResponseError("Coin response is invalid", {
      cause: error,
    })
  }
}

export function coinListQueryOptions(filters: CoinListFilters = {}) {
  const {
    distribution,
    engraverSlug,
    issuerCode,
    issueYear,
    page = COIN_LIST_DEFAULT_PAGE,
    rulingAuthoritySlug,
  } = filters
  if (
    distribution !== undefined &&
    !coinDistributionSchema.safeParse(distribution).success
  ) {
    throw new TypeError("Invalid Coin Distribution")
  }
  if (
    issuerCode !== undefined &&
    !issuerCodeSchema.safeParse(issuerCode).success
  ) {
    throw new InvalidIssuerCodeError("Invalid issuer code")
  }
  if (
    issueYear !== undefined &&
    !coinListYearSchema.safeParse(issueYear).success
  ) {
    throw new InvalidIssueYearError("Invalid Issue Year")
  }
  if (
    engraverSlug !== undefined &&
    !engraverSlugSchema.safeParse(engraverSlug).success
  ) {
    throw new InvalidEngraverSlugError("Invalid engraver slug")
  }
  if (!coinListPageSchema.safeParse(page).success) {
    throw new RangeError("Invalid Coin list page")
  }
  if (
    rulingAuthoritySlug !== undefined &&
    !rulingAuthoritySlugSchema.safeParse(rulingAuthoritySlug).success
  ) {
    throw new InvalidRulingAuthoritySlugError("Invalid Ruling Authority Slug")
  }

  const validatedFilters: ValidatedCoinListFilters = {
    ...(distribution === undefined ? {} : { distribution }),
    engraverSlug: engraverSlug ?? null,
    issuerCode: issuerCode ?? null,
    ...(issueYear === undefined ? {} : { issueYear }),
    page,
    pageSize: COIN_LIST_DEFAULT_PAGE_SIZE,
    ...(rulingAuthoritySlug === undefined ? {} : { rulingAuthoritySlug }),
  }

  return queryOptions({
    queryKey: ["coins", "list", validatedFilters] as const,
    queryFn: () => getCoins(validatedFilters),
    staleTime: 30_000,
  })
}

export function validateCoinId(coinId: string) {
  if (!coinIdSchema.safeParse(coinId).success) {
    throw new InvalidCoinIdError("Invalid coin identifier")
  }

  return coinId
}

function coinDetailQueryKey(coinId: string) {
  const validCoinId = validateCoinId(coinId)

  return ["coins", "detail", validCoinId] as const
}

export function coinDetailQueryOptions(coinId: string) {
  const queryKey = coinDetailQueryKey(coinId)

  return queryOptions({
    queryKey,
    queryFn: () => getCoin(queryKey[2]),
    staleTime: 30_000,
  })
}
