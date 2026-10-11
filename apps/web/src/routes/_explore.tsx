import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  engraverListQueryOptions,
  EngraverListRequestError,
  InvalidEngraverListResponseError,
  InvalidIssuerListResponseError,
  issuerListQueryOptions,
  IssuerListRequestError,
} from "@/data/archive"
import { ExploreFilters } from "@/features/explore/components/explore-filters"
import { exploreSearchSchema } from "@/features/explore/explore-search"

export const Route = createFileRoute("/_explore")({
  validateSearch: exploreSearchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.query(issuerListQueryOptions()),
      context.queryClient.query(engraverListQueryOptions()),
    ])
  },
  component: ExploreLayout,
  errorComponent: ExploreLayoutError,
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
})

function ExploreLayout() {
  const { engraver: engraverSlug, issuer: issuerCode } = Route.useSearch()
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())
  useSuspenseQuery(engraverListQueryOptions())

  return (
    <main className="mt-18 mb-14 flex flex-1 flex-col">
      <ExploreFilters
        engraverSlug={engraverSlug}
        issuerCode={issuerCode}
        issuers={issuerList.issuers}
      />
      <Outlet />
    </main>
  )
}

function ExploreLayoutError({ error }: ErrorComponentProps) {
  const message =
    error instanceof InvalidEngraverListResponseError
      ? "Invalid engraver list response"
      : error instanceof InvalidIssuerListResponseError
        ? "Invalid issuer list response"
        : error instanceof EngraverListRequestError
          ? "Unable to load engravers"
          : error instanceof IssuerListRequestError
            ? "Unable to load issuers"
            : "Unable to load Explore filters"

  return <RouteMessage>{message}</RouteMessage>
}
