import {
  coinDetailResponseSchema,
  coinIdSchema,
  coinNotFoundErrorSchema,
} from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import type { CoinDetailResponse } from "@coin-archive/api"

import { API_BASE_URL } from "@/config"

export class CoinNotFoundError extends Error {}
export class InvalidCoinResponseError extends Error {}
class CoinRequestError extends Error {}
export class InvalidCoinIdError extends Error {}

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

export function validateCoinId(coinId: string) {
  if (!coinIdSchema.safeParse(coinId).success) {
    throw new InvalidCoinIdError("Invalid coin identifier")
  }

  return coinId
}

export function coinDetailQueryOptions(coinId: string) {
  const validCoinId = validateCoinId(coinId)

  return queryOptions({
    queryKey: ["coins", "detail", validCoinId] as const,
    queryFn: () => getCoin(validCoinId),
    staleTime: 30_000,
  })
}
