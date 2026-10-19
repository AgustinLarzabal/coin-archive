import { createFileRoute, notFound } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  coinDetailQueryOptions,
  CoinNotFoundError,
  InvalidCoinIdError,
  InvalidCoinResponseError,
  validateCoinId,
} from "@/data/archive"
import { CoinViewer } from "@/features/coin-viewer/coin-viewer"
import { exploreSearchSchema } from "@/features/explore/explore-search"

export const Route = createFileRoute("/coins/$coinId")({
  validateSearch: exploreSearchSchema,
  loader: async ({ context, params }) => {
    const coinId = validateCoinId(params.coinId)
    try {
      await context.queryClient.query(coinDetailQueryOptions(coinId))
    } catch (error) {
      if (error instanceof CoinNotFoundError) {
        throw notFound()
      }
      throw error
    }
  },
  component: CoinViewerRoute,
  errorComponent: CoinViewerError,
  pendingComponent: () => <RouteMessage>Loading coin…</RouteMessage>,
  notFoundComponent: () => <RouteMessage>Coin not found</RouteMessage>,
})

function CoinViewerRoute() {
  const { coinId } = Route.useParams()
  const search = Route.useSearch()
  return <CoinViewer coinId={coinId} search={search} />
}

function CoinViewerError({ error }: ErrorComponentProps) {
  let message = "Unable to load coin"

  if (error instanceof InvalidCoinIdError) {
    message = "Invalid coin identifier"
  } else if (error instanceof InvalidCoinResponseError) {
    message = "Invalid coin response"
  }

  return <RouteMessage>{message}</RouteMessage>
}
