import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  currencyListQueryOptions,
  CurrencyListRequestError,
  distributionListQueryOptions,
  DistributionListRequestError,
  engraverListQueryOptions,
  EngraverListRequestError,
  InvalidCurrencyListResponseError,
  InvalidDistributionListResponseError,
  InvalidEngraverListResponseError,
  InvalidIssuerListResponseError,
  InvalidMintListResponseError,
  InvalidRulingAuthorityListResponseError,
  issuerListQueryOptions,
  IssuerListRequestError,
  mintListQueryOptions,
  MintListRequestError,
  rulingAuthorityListQueryOptions,
  RulingAuthorityListRequestError,
} from "@/data/archive"
import { exploreSearchSchema } from "@/features/explore/explore-search"
import { ExploreFilters } from "@/features/explore/filters/explore-filters"

export const Route = createFileRoute("/_explore")({
  validateSearch: exploreSearchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.query(currencyListQueryOptions()),
      context.queryClient.query(distributionListQueryOptions()),
      context.queryClient.query(engraverListQueryOptions()),
      context.queryClient.query(issuerListQueryOptions()),
      context.queryClient.query(mintListQueryOptions()),
      context.queryClient.query(rulingAuthorityListQueryOptions()),
    ])
  },
  component: ExploreLayout,
  errorComponent: ExploreLayoutError,
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
})

function ExploreLayout() {
  const search = Route.useSearch()
  const { data: currencyList } = useSuspenseQuery(currencyListQueryOptions())
  const { data: distributionList } = useSuspenseQuery(
    distributionListQueryOptions()
  )
  const { data: engraverList } = useSuspenseQuery(engraverListQueryOptions())
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())
  const { data: mintList } = useSuspenseQuery(mintListQueryOptions())
  const { data: rulingAuthorityList } = useSuspenseQuery(
    rulingAuthorityListQueryOptions()
  )

  return (
    <main className="mt-18 mb-10 flex flex-1 flex-col">
      <nav
        aria-label="Explore filters"
        className="flex flex-wrap items-start gap-3 border-b px-5 py-4 md:items-center md:gap-5 md:px-10"
      >
        <ExploreFilters
          currencies={currencyList.currencies}
          currencySlug={search.currency}
          distributions={distributionList.distributions}
          distribution={search.distribution}
          engravers={engraverList.engravers}
          engraverSlug={search.engraver}
          issuers={issuerList.issuers}
          issuerCode={search.issuer}
          mints={mintList.mints}
          mintSlug={search.mint}
          rulingAuthorities={rulingAuthorityList.rulers}
          rulingAuthoritySlug={search.ruler}
        />
      </nav>
      <Outlet />
    </main>
  )
}

function ExploreLayoutError({ error }: ErrorComponentProps) {
  return <RouteMessage>{getExploreLayoutErrorMessage(error)}</RouteMessage>
}

function getExploreLayoutErrorMessage(error: unknown) {
  if (error instanceof InvalidRulingAuthorityListResponseError) {
    return "Invalid Ruling Authority list response"
  }
  if (error instanceof RulingAuthorityListRequestError) {
    return "Unable to load Ruling Authorities"
  }
  if (error instanceof InvalidEngraverListResponseError) {
    return "Invalid engraver list response"
  }
  if (error instanceof EngraverListRequestError) {
    return "Unable to load engravers"
  }
  if (error instanceof InvalidMintListResponseError) {
    return "Invalid Mint list response"
  }
  if (error instanceof MintListRequestError) {
    return "Unable to load Mints"
  }
  if (error instanceof InvalidCurrencyListResponseError) {
    return "Invalid Currency list response"
  }
  if (error instanceof CurrencyListRequestError) {
    return "Unable to load Currencies"
  }
  if (error instanceof InvalidDistributionListResponseError) {
    return "Invalid Coin Distribution list response"
  }
  if (error instanceof DistributionListRequestError) {
    return "Unable to load Coin Distributions"
  }
  if (error instanceof InvalidIssuerListResponseError) {
    return "Invalid issuer list response"
  }
  if (error instanceof IssuerListRequestError) {
    return "Unable to load issuers"
  }
  return "Unable to load Explore filters"
}
