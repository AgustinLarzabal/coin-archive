import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  coinListQueryOptions,
  engraverListQueryOptions,
  InvalidCoinListResponseError,
  issuerListQueryOptions,
  rulingAuthorityListQueryOptions,
} from "@/data/archive"
import { Explore } from "@/features/explore/explore"
import { getExploreCoinListFilters } from "@/features/explore/explore-search"

export const Route = createFileRoute("/_explore/")({
  loaderDeps: ({ search }) => getExploreCoinListFilters(search),
  beforeLoad: ({ search }) => {
    if (search.page === 1) {
      throw redirect({
        to: "/",
        search: {
          distribution: search.distribution,
          issuer: search.issuer,
          engraver: search.engraver,
          ruler: search.ruler,
          year: search.year,
        },
        replace: true,
      })
    }
  },
  loader: async ({ context, deps: filters }) => {
    const coinList = await context.queryClient.query(
      coinListQueryOptions(filters)
    )
    const currentPage = filters.page ?? 1
    const lastPage = Math.max(coinList.pagination.totalPages, 1)

    if (currentPage > lastPage) {
      throw redirect({
        to: "/",
        search: {
          distribution: filters.distribution,
          issuer: filters.issuerCode,
          engraver: filters.engraverSlug,
          ruler: filters.rulingAuthoritySlug,
          year: filters.issueYear,
          page: lastPage === 1 ? undefined : lastPage,
        },
        replace: true,
      })
    }
  },
  component: ExploreRoute,
  errorComponent: ExploreError,
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
})

function ExploreRoute() {
  const filters = Route.useLoaderDeps()
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())
  const { data: engraverList } = useSuspenseQuery(engraverListQueryOptions())
  const { data: rulerList } = useSuspenseQuery(
    rulingAuthorityListQueryOptions()
  )
  const selectedIssuer = issuerList.issuers.find(
    (issuer) => issuer.code === filters.issuerCode
  )
  const selectedEngraver = engraverList.engravers.find(
    (engraver) => engraver.slug === filters.engraverSlug
  )
  const selectedRuler = rulerList.rulers.find(
    (ruler) => ruler.slug === filters.rulingAuthoritySlug
  )

  return filters.issuerCode && !selectedIssuer ? (
    <RouteMessage>Issuer not found</RouteMessage>
  ) : filters.engraverSlug && !selectedEngraver ? (
    <RouteMessage>Engraver not found</RouteMessage>
  ) : filters.rulingAuthoritySlug && !selectedRuler ? (
    <RouteMessage>Ruler / Period not found</RouteMessage>
  ) : (
    <Explore filters={filters} />
  )
}

function ExploreError({ error }: ErrorComponentProps) {
  return <RouteMessage>{getExploreErrorMessage(error)}</RouteMessage>
}

function getExploreErrorMessage(error: unknown) {
  if (error instanceof InvalidCoinListResponseError) {
    return "Invalid coin list response"
  }

  return "Unable to load coins"
}
