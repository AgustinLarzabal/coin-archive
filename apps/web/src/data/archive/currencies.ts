import { currencyListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import type { CurrencyListResponse } from "@coin-archive/api"

import { fetchArchive } from "./fetch.server"

export class InvalidCurrencyListResponseError extends Error {}
export class CurrencyListRequestError extends Error {}

async function getCurrencies(): Promise<CurrencyListResponse> {
  let response: Response

  try {
    response = await fetchArchive(`/v1/currencies`)
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

const getCurrenciesOnServer = createServerFn({ method: "GET" }).handler(() =>
  getCurrencies()
)

export function currencyListQueryOptions() {
  return queryOptions({
    queryKey: ["currencies", "list"] as const,
    queryFn: () => getCurrenciesOnServer(),
    staleTime: Infinity,
  })
}
