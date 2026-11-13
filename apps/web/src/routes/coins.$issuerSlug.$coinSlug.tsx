import { slugSchema } from "@coin-archive/api"
import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  coinDetailQueryOptions,
  CoinNotFoundError,
  InvalidCoinResponseError,
} from "@/data/archive"
import { CoinViewer } from "@/features/coin-viewer/coin-viewer"
import {
  canonicalExploreHref,
  exploreSearchSchema,
} from "@/features/explore/explore-search"

export const Route = createFileRoute("/coins/$issuerSlug/$coinSlug")({
  validateSearch: exploreSearchSchema,
  beforeLoad: ({ search, location }) => {
    const href = canonicalExploreHref(search, location)
    if (href) throw redirect({ href, replace: true })
  },
  loader: async ({ context, params }) => {
    if (!slugSchema.safeParse(params.issuerSlug).success) throw notFound()
    try {
      const coin = await context.queryClient.query(
        coinDetailQueryOptions(params.coinSlug, true)
      )
      if (coin.issuer.slug !== params.issuerSlug) throw notFound()
    } catch (error) {
      if (error instanceof CoinNotFoundError) throw notFound()
      throw error
    }
  },
  component: () => {
    const { coinSlug } = Route.useParams()
    return <CoinViewer coinSlug={coinSlug} search={Route.useSearch()} />
  },
  errorComponent: ({ error }: ErrorComponentProps) => (
    <RouteMessage>
      {error instanceof InvalidCoinResponseError
        ? "Invalid coin response"
        : "Unable to load coin"}
    </RouteMessage>
  ),
  pendingComponent: () => <RouteMessage>Loading coin…</RouteMessage>,
  notFoundComponent: () => <RouteMessage>Coin not found</RouteMessage>,
})
