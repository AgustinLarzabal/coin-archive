import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  compositionListQueryOptions,
  currencyListQueryOptions,
  distributionListQueryOptions,
  engraverListQueryOptions,
  InvalidIssuerListResponseError,
  issuerListQueryOptions,
  IssuerListRequestError,
  mintListQueryOptions,
  orientationListQueryOptions,
  rulingAuthorityListQueryOptions,
  shapeListQueryOptions,
  tagListQueryOptions,
  techniqueListQueryOptions,
} from "@/data/archive"
import { exploreSearchSchema } from "@/features/explore/explore-search"
import { ExploreFilters } from "@/features/explore/filters/explore-filters"

export const Route = createFileRoute("/_explore")({
  validateSearch: exploreSearchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.query(currencyListQueryOptions()),
      context.queryClient.query(compositionListQueryOptions()),
      context.queryClient.query(distributionListQueryOptions()),
      context.queryClient.query(techniqueListQueryOptions()),
      context.queryClient.query(engraverListQueryOptions()),
      context.queryClient.query(issuerListQueryOptions()),
      context.queryClient.query(mintListQueryOptions()),
      context.queryClient.query(rulingAuthorityListQueryOptions()),
      context.queryClient.query(tagListQueryOptions()),
      context.queryClient.query(shapeListQueryOptions()),
      context.queryClient.query(orientationListQueryOptions()),
    ])
  },
  component: ExploreLayout,
  errorComponent: ExploreLayoutError,
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
})

function ExploreLayout() {
  const search = Route.useSearch()
  const { data: currencyList } = useSuspenseQuery(currencyListQueryOptions())
  const { data: compositionList } = useSuspenseQuery(
    compositionListQueryOptions()
  )
  const { data: distributionList } = useSuspenseQuery(
    distributionListQueryOptions()
  )
  const { data: techniqueList } = useSuspenseQuery(techniqueListQueryOptions())
  const { data: engraverList } = useSuspenseQuery(engraverListQueryOptions())
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())
  const { data: mintList } = useSuspenseQuery(mintListQueryOptions())
  const { data: rulingAuthorityList } = useSuspenseQuery(
    rulingAuthorityListQueryOptions()
  )
  const { data: tagList } = useSuspenseQuery(tagListQueryOptions())
  const { data: shapeList } = useSuspenseQuery(shapeListQueryOptions())
  const { data: orientationList } = useSuspenseQuery(
    orientationListQueryOptions()
  )

  return (
    <main className="mt-18 mb-10 flex flex-1 flex-col">
      <nav
        aria-label="Explore filters"
        className="flex flex-wrap items-start gap-3 border-b px-5 py-4 md:items-center md:gap-5 md:px-10"
      >
        <ExploreFilters
          currencies={currencyList.currencies}
          compositions={compositionList.compositions}
          distributions={distributionList.distributions}
          techniques={techniqueList.techniques}
          engravers={engraverList.engravers}
          issuers={issuerList.issuers}
          mints={mintList.mints}
          rulingAuthorities={rulingAuthorityList.rulers}
          tags={tagList.tags}
          shapes={shapeList.shapes}
          orientations={orientationList.orientations}
          search={search}
        />
      </nav>
      <Outlet />
    </main>
  )
}

function ExploreLayoutError({ error }: ErrorComponentProps) {
  return (
    <RouteMessage>
      {error instanceof InvalidIssuerListResponseError
        ? "Invalid issuer list response"
        : error instanceof IssuerListRequestError
          ? "Unable to load issuers"
          : "Unable to load Explore filters"}
    </RouteMessage>
  )
}
