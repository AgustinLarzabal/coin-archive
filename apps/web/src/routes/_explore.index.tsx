import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  coinListQueryOptions,
  InvalidCoinListResponseError,
  issuerListQueryOptions,
} from "@/data/archive"
import { Explore } from "@/features/explore/explore"
import { getExploreCoinListFilters } from "@/features/explore/explore-search"

export const Route = createFileRoute("/_explore/")({
  loaderDeps: ({ search }) => getExploreCoinListFilters(search),
  loader: async ({ context, deps: filters }) => {
    await context.queryClient.query(coinListQueryOptions(filters))
  },
  component: ExploreRoute,
  errorComponent: ExploreError,
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
})

function ExploreRoute() {
  const filters = Route.useLoaderDeps()
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())
  const selectedIssuer = issuerList.issuers.find(
    (issuer) => issuer.code === filters.issuerCode
  )

  return filters.issuerCode && !selectedIssuer ? (
    <RouteMessage>Issuer not found</RouteMessage>
  ) : (
    <Explore filters={filters} issuer={selectedIssuer} />
  )
}

function ExploreError({ error }: ErrorComponentProps) {
  const message =
    error instanceof InvalidCoinListResponseError
      ? "Invalid coin list response"
      : "Unable to load coins"

  return <RouteMessage>{message}</RouteMessage>
}
