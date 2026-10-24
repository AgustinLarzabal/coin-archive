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
import { ExploreAdvancedFilters } from "@/features/explore/filters/advanced/explore-advanced-filters"
import { ExploreBasicFilters } from "@/features/explore/filters/basic/explore-basic-filters"

export const Route = createFileRoute("/_explore")({
  validateSearch: exploreSearchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.query(currencyListQueryOptions()),
      context.queryClient.query(distributionListQueryOptions()),
      context.queryClient.query(issuerListQueryOptions()),
      context.queryClient.query(mintListQueryOptions()),
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
    amount,
    currency: currencySlug,
    distribution,
    engraver: engraverSlug,
    issuer: issuerCode,
    mint: mintSlug,
    ruler: rulingAuthoritySlug,
    year,
  } = Route.useSearch()
  const { data: currencyList } = useSuspenseQuery(currencyListQueryOptions())
  const { data: distributionList } = useSuspenseQuery(
    distributionListQueryOptions()
  )
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())
  const { data: mintList } = useSuspenseQuery(mintListQueryOptions())
  const { data: engraverList } = useSuspenseQuery(engraverListQueryOptions())
  const { data: rulingAuthorityList } = useSuspenseQuery(
    rulingAuthorityListQueryOptions()
  )

  return (
    <main className="mt-18 mb-10 flex flex-1 flex-col">
      <ExploreBasicFilters
        amount={amount}
        currencySlug={currencySlug}
        distribution={distribution}
        distributions={distributionList.distributions}
        engraverSlug={engraverSlug}
        engravers={engraverList.engravers}
        mintSlug={mintSlug}
        mints={mintList.mints}
        year={year}
      />
      <ExploreAdvancedFilters
        currencies={currencyList.currencies}
        currencySlug={currencySlug}
        issuerCode={issuerCode}
        issuers={issuerList.issuers}
        rulingAuthoritySlug={rulingAuthoritySlug}
        rulingAuthorities={rulingAuthorityList.rulers}
      />
      <Outlet />
    </main>
  )
}

function ExploreLayoutError({ error }: ErrorComponentProps) {
  return <RouteMessage>{getExploreLayoutErrorMessage(error)}</RouteMessage>
}

function getExploreLayoutErrorMessage(error: unknown) {
  if (error instanceof InvalidCurrencyListResponseError) {
    return "Invalid Currency list response"
  }

  if (error instanceof InvalidMintListResponseError) {
    return "Invalid Mint list response"
  }

  if (error instanceof MintListRequestError) {
    return "Unable to load Mints"
  }

  if (error instanceof InvalidDistributionListResponseError) {
    return "Invalid Coin Distribution list response"
  }

  if (error instanceof DistributionListRequestError) {
    return "Unable to load Coin Distributions"
  }

  if (error instanceof CurrencyListRequestError) {
    return "Unable to load Currencies"
  }

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
