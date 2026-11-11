import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { render } from "@testing-library/react"
import type {
  CoinListPaginationResponse,
  CompositionResponse,
  CurrencyResponse,
  EngraverListItemResponse,
  IssuerResponse,
  MintResponse,
  NamedSlugResponse,
} from "@coin-archive/api"

import { getRouter } from "@/router"

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
  pagination,
  currencies = [],
  distributions = [],
  techniques = [],
  compositions = [],
  engravers = [],
  issuers = [],
  mints = [],
  rulers = [],
  tags = [],
  shapes = [],
  orientations = [
    { slug: "medal", name: "Medal" },
    { slug: "coin", name: "Coin" },
  ],
}: {
  coins?: Array<unknown>
  pagination?: CoinListPaginationResponse
  currencies?: Array<CurrencyResponse>
  distributions?: Array<NamedSlugResponse>
  techniques?: Array<NamedSlugResponse>
  compositions?: Array<CompositionResponse>
  engravers?: Array<EngraverListItemResponse>
  issuers?: Array<IssuerResponse>
  mints?: Array<MintResponse>
  rulers?: Array<NamedSlugResponse>
  tags?: Array<NamedSlugResponse>
  shapes?: Array<NamedSlugResponse>
  orientations?: Array<NamedSlugResponse>
} = {}) {
  return (input: string | URL | Request) => {
    const url = String(input)

    if (url.endsWith("/v1/currencies"))
      return Promise.resolve(jsonResponse({ currencies }))
    if (url.endsWith("/v1/distributions"))
      return Promise.resolve(jsonResponse({ distributions }))
    if (url.endsWith("/v1/techniques"))
      return Promise.resolve(jsonResponse({ techniques }))
    if (url.endsWith("/v1/compositions"))
      return Promise.resolve(jsonResponse({ compositions }))
    if (url.endsWith("/v1/engravers"))
      return Promise.resolve(jsonResponse({ engravers }))
    if (url.endsWith("/v1/issuers"))
      return Promise.resolve(jsonResponse({ issuers }))
    if (url.endsWith("/v1/mints"))
      return Promise.resolve(jsonResponse({ mints }))
    if (url.endsWith("/v1/rulers"))
      return Promise.resolve(jsonResponse({ rulers }))
    if (url.endsWith("/v1/tags")) return Promise.resolve(jsonResponse({ tags }))
    if (url.endsWith("/v1/shapes"))
      return Promise.resolve(jsonResponse({ shapes }))
    if (url.endsWith("/v1/orientations"))
      return Promise.resolve(jsonResponse({ orientations }))
    return Promise.resolve(coinListJsonResponse(coins, pagination))
  }
}

export function renderArchiveRoute(initialEntry = "/") {
  const history = createMemoryHistory({ initialEntries: [initialEntry] })
  const router = getRouter({ history })
  render(<RouterProvider router={router} />)
  return router
}
