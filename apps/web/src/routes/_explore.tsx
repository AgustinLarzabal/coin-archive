import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  engraverListQueryOptions,
  EngraverListRequestError,
  InvalidEngraverListResponseError,
  InvalidIssuerListResponseError,
  InvalidRulingAuthorityListResponseError,
  issuerListQueryOptions,
  IssuerListRequestError,
  rulingAuthorityListQueryOptions,
  RulingAuthorityListRequestError,
} from "@/data/archive"
import { ExploreFilters } from "@/features/explore/components/explore-filters"
import { exploreSearchSchema } from "@/features/explore/explore-search"

export const Route = createFileRoute("/_explore")({
  validateSearch: exploreSearchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.query(issuerListQueryOptions()),
      context.queryClient.query(engraverListQueryOptions()),
      context.queryClient.query(rulingAuthorityListQueryOptions()),
    ])
  },
  component: ExploreLayout,
  errorComponent: ExploreLayoutError,
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
})

function ExploreLayout() {
  const {
    engraver: engraverSlug,
    issuer: issuerCode,
    ruler: rulerSlug,
    year,
  } = Route.useSearch()
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())
  const { data: engraverList } = useSuspenseQuery(engraverListQueryOptions())
  const { data: rulerList } = useSuspenseQuery(
    rulingAuthorityListQueryOptions()
  )

  return (
    <main className="mt-18 mb-10 flex flex-1 flex-col">
      <ExploreFilters
        engraverSlug={engraverSlug}
        engravers={engraverList.engravers}
        issuerCode={issuerCode}
        issuers={issuerList.issuers}
        rulerSlug={rulerSlug}
        rulers={rulerList.rulers}
        year={year}
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

  if (error instanceof InvalidRulingAuthorityListResponseError) {
    return "Invalid Ruling Authority list response"
  }

  if (error instanceof RulingAuthorityListRequestError) {
    return "Unable to load Ruling Authorities"
  }

  return "Unable to load Explore filters"
}
