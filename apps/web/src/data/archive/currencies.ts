import { currencyListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import type { CurrencyListResponse } from "@coin-archive/api"

import { API_BASE_URL } from "@/config"

export class InvalidCurrencyListResponseError extends Error {}
export class CurrencyListRequestError extends Error {}

async function getCurrencies(): Promise<CurrencyListResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/v1/currencies`)
  } catch (error) {
    throw new CurrencyListRequestError("Currency list request failed", {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new CurrencyListRequestError(
      `Currency list request failed with HTTP ${response.status}`
    )
  }

  try {
    return currencyListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidCurrencyListResponseError(
      "Currency list response is invalid",
      { cause: error }
    )
  }
}

export function currencyListQueryOptions() {
  return queryOptions({
    queryKey: ["currencies", "list"] as const,
    queryFn: getCurrencies,
    staleTime: Infinity,
  })
}
