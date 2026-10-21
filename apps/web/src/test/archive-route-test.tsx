import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { render } from "@testing-library/react"
import { vi } from "vitest"
import type {
  CoinListPaginationResponse,
  CurrencyResponse,
  DistributionListItemResponse,
  EngraverListItemResponse,
  IssuerResponse,
  RulingAuthorityListItemResponse,
} from "@coin-archive/api"

import { getRouter } from "@/router"

export const defaultDistributions: Array<DistributionListItemResponse> = [
  { slug: "standard-circulation", name: "Standard circulation" },
  { slug: "circulating-commemorative", name: "Circulating commemorative" },
  { slug: "non-circulating", name: "Non-circulating" },
]

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  })
}

export function coinListJsonResponse(
  coins: Array<unknown>,
  pagination: CoinListPaginationResponse = {
    page: 1,
    pageSize: 24,
    totalItems: coins.length,
    totalPages: coins.length === 0 ? 0 : 1,
  }
) {
  return jsonResponse({
    coins,
    pagination,
  })
}

export function createArchiveFetch({
  coins = [],
  currencies = [],
  distributions = defaultDistributions,
  engravers = [],
  pagination,
  issuers = [],
  rulers = [],
}: {
  coins?: Array<unknown>
  currencies?: Array<CurrencyResponse>
  distributions?: Array<DistributionListItemResponse>
  engravers?: Array<EngraverListItemResponse>
  pagination?: CoinListPaginationResponse
  issuers?: Array<IssuerResponse>
  rulers?: Array<RulingAuthorityListItemResponse>
} = {}) {
  return (input: string | URL | Request) => {
    const url = String(input)

    return Promise.resolve(
      url.endsWith("/v1/issuers")
        ? jsonResponse({ issuers })
        : url.endsWith("/v1/distributions")
          ? jsonResponse({ distributions })
          : url.endsWith("/v1/currencies")
            ? jsonResponse({ currencies })
            : url.endsWith("/v1/rulers")
              ? jsonResponse({ rulers })
              : url.endsWith("/v1/engravers")
                ? jsonResponse({ engravers })
                : coinListJsonResponse(coins, pagination)
    )
  }
}

export function renderArchiveRoute(
  initialEntry = "/",
  rulers: Array<RulingAuthorityListItemResponse> = [],
  currencies: Array<CurrencyResponse> | Promise<Response> | Response = [],
  distributions:
    | Array<DistributionListItemResponse>
    | Promise<Response>
    | Response = defaultDistributions
) {
  const fetchWithoutReferenceFixtures = globalThis.fetch
  vi.stubGlobal("fetch", (input: string | URL | Request, init?: RequestInit) =>
    String(input).endsWith("/v1/rulers")
      ? Promise.resolve(jsonResponse({ rulers }))
      : String(input).endsWith("/v1/distributions")
        ? Array.isArray(distributions)
          ? Promise.resolve(jsonResponse({ distributions }))
          : Promise.resolve(distributions)
        : String(input).endsWith("/v1/currencies")
          ? Array.isArray(currencies)
            ? Promise.resolve(jsonResponse({ currencies }))
            : Promise.resolve(currencies)
          : init === undefined
            ? fetchWithoutReferenceFixtures(input)
            : fetchWithoutReferenceFixtures(input, init)
  )
  const history = createMemoryHistory({ initialEntries: [initialEntry] })
  const router = getRouter({ history })
  render(<RouterProvider router={router} />)
  return router
}
