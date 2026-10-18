import { QueryClient } from "@tanstack/react-query"
import {
  createRouter as createTanStackRouter,
  defaultParseSearch,
} from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { routeTree } from "./routeTree.gen"
import type { RouterHistory } from "@tanstack/react-router"

export interface RouterContext {
  queryClient: QueryClient
}

// Tune both thresholds together when production navigation traces are available.
const ROUTE_PENDING_FEEDBACK_MS = 200
const BROWSER_QUERY_RETENTION_MS = 30 * 60 * 1_000
function parseSearchPreservingAmount(searchString: string) {
  const search: Record<string, unknown> = defaultParseSearch(searchString)
  const searchParams = new URLSearchParams(
    searchString.startsWith("?") ? searchString.slice(1) : searchString
  )
  const amountValues = searchParams.getAll("amount")

  if (amountValues.length === 1) {
    const [amount] = amountValues
    try {
      const parsedAmount = JSON.parse(amount)
      search.amount = typeof parsedAmount === "string" ? parsedAmount : amount
    } catch {
      search.amount = amount
    }
  } else if (amountValues.length > 1) {
    search.amount = amountValues
  }

  return search
}

export function getRouter(options: { history?: RouterHistory } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime:
          typeof window === "undefined" ? Infinity : BROWSER_QUERY_RETENTION_MS,
        retry: false,
      },
    },
  })
  const router = createTanStackRouter({
    context: { queryClient },
    history: options.history,
    parseSearch: parseSearchPreservingAmount,
    routeTree,

    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingMs: ROUTE_PENDING_FEEDBACK_MS,
    defaultPendingMinMs: ROUTE_PENDING_FEEDBACK_MS,
    defaultViewTransition: true,
  })

  setupRouterSsrQueryIntegration({ queryClient, router })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
