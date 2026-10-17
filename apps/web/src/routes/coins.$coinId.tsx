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

export const Route = createFileRoute("/coins/$coinId")({
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
  return <CoinViewer coinId={coinId} />
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
