import { AmountFilter } from "./amount-filter"
import { CurrencyFilter } from "./currency-filter"
import { DistributionFilter } from "./distribution-filter"
import { EngraverFilter } from "./engraver-filter"
import { IssueYearFilter } from "./issue-year-filter"
import { IssuerFilter } from "./issuer-filter"
import { MintFilter } from "./mint-filter"
import { RulingAuthorityFilter } from "./ruling-authority-filter"
import type {
  CoinDistribution,
  CoinListYear,
  CurrencyResponse,
  DistributionListItemResponse,
  EngraverListItemResponse,
  IssuerResponse,
  MintResponse,
  RulingAuthorityListItemResponse,
} from "@coin-archive/api"

export function ExploreBasicFilters({
  amount,
  distribution,
  distributions,
  currencies,
  currencySlug,
  engraverSlug,
  engravers,
  issuerCode,
  issuers,
  mintSlug,
  mints,
  rulingAuthorities,
  rulingAuthoritySlug,
  year,
}: {
  amount?: string
  distribution?: CoinDistribution
  distributions: Array<DistributionListItemResponse>
  currencies: Array<CurrencyResponse>
  currencySlug?: string
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
  issuerCode?: string
  issuers: Array<IssuerResponse>
  mintSlug?: string
  mints: Array<MintResponse>
  rulingAuthorities: Array<RulingAuthorityListItemResponse>
  rulingAuthoritySlug?: string
  year?: CoinListYear
}) {
  return (
    <nav
      aria-label="Explore filters"
      className="flex min-h-18 flex-wrap items-start gap-3 border-b px-5 py-5 md:items-center md:gap-5 md:px-10"
    >
      <DistributionFilter
        distribution={distribution}
        distributions={distributions}
      />
      <IssuerFilter issuerCode={issuerCode} issuers={issuers} />
      <MintFilter mintSlug={mintSlug} mints={mints} />
      <CurrencyFilter currencies={currencies} currencySlug={currencySlug} />
      <AmountFilter
        amount={amount}
        currencySelected={currencySlug !== undefined}
      />
      <RulingAuthorityFilter
        rulingAuthoritySlug={rulingAuthoritySlug}
        rulingAuthorities={rulingAuthorities}
      />
      <EngraverFilter engraverSlug={engraverSlug} engravers={engravers} />
      <IssueYearFilter year={year} />
    </nav>
  )
}
