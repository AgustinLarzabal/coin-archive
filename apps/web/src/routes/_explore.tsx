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
  const { data: engraverList } = useSuspenseQuery(engraverListQueryOptions())

  return (
    <main className="mt-18 mb-10 flex flex-1 flex-col">
      <ExploreFilters
        engraverSlug={engraverSlug}
        engravers={engraverList.engravers}
        issuerCode={issuerCode}
        issuers={issuerList.issuers}
      />
      <Outlet />
    </main>
  )
}

function ExploreLayoutError({ error }: ErrorComponentProps) {
  return <RouteMessage>{getExploreLayoutErrorMessage(error)}</RouteMessage>
}

function getExploreLayoutErrorMessage(error: unknown) {
  if (error instanceof InvalidEngraverListResponseError) {
    return "Invalid engraver list response"
  }

  if (error instanceof InvalidIssuerListResponseError) {
    return "Invalid issuer list response"
  }

  if (error instanceof EngraverListRequestError) {
    return "Unable to load engravers"
  }

  if (error instanceof IssuerListRequestError) {
    return "Unable to load issuers"
  }

  return "Unable to load Explore filters"
}
