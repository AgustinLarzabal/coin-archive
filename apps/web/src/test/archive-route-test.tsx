import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { render } from "@testing-library/react"
import type { EngraverListItemResponse, IssuerResponse } from "@workspace/api"

import { getRouter } from "@/router"

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  })
}

export function coinListJsonResponse(coins: Array<unknown>, page = 1) {
  return jsonResponse({
    coins,
    pagination: {
      page,
      pageSize: 24,
      totalItems: coins.length,
      totalPages: coins.length === 0 ? 0 : 1,
    },
  })
}

export function createArchiveFetch({
  coins = [],
  engravers = [],
  issuers = [],
}: {
  coins?: Array<unknown>
  engravers?: Array<EngraverListItemResponse>
  issuers?: Array<IssuerResponse>
} = {}) {
  return (input: string | URL | Request) => {
    const url = String(input)

    return Promise.resolve(
      url.endsWith("/v1/issuers")
        ? jsonResponse({ issuers })
        : url.endsWith("/v1/engravers")
          ? jsonResponse({ engravers })
          : coinListJsonResponse(coins)
    )
  }
}

export function renderArchiveRoute(initialEntry = "/") {
  const history = createMemoryHistory({ initialEntries: [initialEntry] })
  const router = getRouter({ history })
  render(<RouterProvider router={router} />)
  return router
}
