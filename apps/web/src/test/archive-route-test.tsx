import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { render } from "@testing-library/react"
import { vi } from "vitest"
import type {
  CoinListPaginationResponse,
  EngraverListItemResponse,
  IssuerResponse,
  RulingAuthorityListItemResponse,
} from "@workspace/api"

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
  engravers = [],
  pagination,
  issuers = [],
  rulers = [],
}: {
  coins?: Array<unknown>
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
  rulers: Array<RulingAuthorityListItemResponse> = []
) {
  const fetchWithoutRulerFixture = globalThis.fetch
  vi.stubGlobal("fetch", (input: string | URL | Request, init?: RequestInit) =>
    String(input).endsWith("/v1/rulers")
      ? Promise.resolve(jsonResponse({ rulers }))
      : init === undefined
        ? fetchWithoutRulerFixture(input)
        : fetchWithoutRulerFixture(input, init)
  )
  const history = createMemoryHistory({ initialEntries: [initialEntry] })
  const router = getRouter({ history })
  render(<RouterProvider router={router} />)
  return router
}
