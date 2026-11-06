import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  coinListQueryOptions,
  currencyListQueryOptions,
  engraverListQueryOptions,
  InvalidCoinListResponseError,
  issuerListQueryOptions,
  mintListQueryOptions,
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
          currency: search.currency,
          distribution: search.distribution,
          engraver: search.engraver,
          issuer: search.issuer,
          mint: search.mint,
          ruler: search.ruler,
          size: search.size,
          thickness: search.thickness,
          weight: search.weight,
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
          currency: filters.currencySlug,
          distribution: filters.distribution,
          engraver: filters.engraverSlug,
          issuer: filters.issuerCode,
          mint: filters.mintSlug,
          ruler: filters.rulingAuthoritySlug,
          size: filters.size,
          thickness: filters.thickness,
          weight: filters.weight,
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
  const { data: currencyList } = useSuspenseQuery(currencyListQueryOptions())
  const { data: engraverList } = useSuspenseQuery(engraverListQueryOptions())
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())
  const { data: mintList } = useSuspenseQuery(mintListQueryOptions())
  const { data: rulingAuthorityList } = useSuspenseQuery(
    rulingAuthorityListQueryOptions()
  )
  const selectedCurrency = currencyList.currencies.find(
    (currency) => currency.slug === filters.currencySlug
  )
  const selectedEngraver = engraverList.engravers.find(
    (engraver) => engraver.slug === filters.engraverSlug
  )
  const selectedIssuer = issuerList.issuers.find(
    (issuer) => issuer.code === filters.issuerCode
  )
  const selectedMint = mintList.mints.find(
    (mint) => mint.slug === filters.mintSlug
  )
  const selectedRuler = rulingAuthorityList.rulers.find(
    (ruler) => ruler.slug === filters.rulingAuthoritySlug
  )

  return filters.issuerCode && !selectedIssuer ? (
    <RouteMessage>Issuer not found</RouteMessage>
  ) : filters.currencySlug && !selectedCurrency ? (
    <RouteMessage>Currency not found</RouteMessage>
  ) : filters.engraverSlug && !selectedEngraver ? (
    <RouteMessage>Engraver not found</RouteMessage>
  ) : filters.mintSlug && !selectedMint ? (
    <RouteMessage>Mint not found</RouteMessage>
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
