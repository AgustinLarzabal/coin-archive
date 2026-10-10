import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  InvalidIssuerListResponseError,
  issuerListQueryOptions,
} from "@/data/archive"
import { ExploreFilters } from "@/features/explore/components/explore-filters"
import { exploreSearchSchema } from "@/features/explore/explore-search"

export const Route = createFileRoute("/_explore")({
  validateSearch: exploreSearchSchema,
  loader: async ({ context }) => {
    await context.queryClient.query(issuerListQueryOptions())
  },
  component: ExploreLayout,
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
  errorComponent: ExploreLayoutError,
})

function ExploreLayout() {
  const { issuer: issuerCode } = Route.useSearch()
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())

  return (
    <main className="mt-18 mb-14 flex flex-1 flex-col">
      <ExploreFilters issuerCode={issuerCode} issuers={issuerList.issuers} />
      <Outlet />
    </main>
  )
}

function ExploreLayoutError({ error }: ErrorComponentProps) {
  return (
    <RouteMessage>
      {error instanceof InvalidIssuerListResponseError
        ? "Invalid issuer list response"
        : "Unable to load coins"}
    </RouteMessage>
  )
}
