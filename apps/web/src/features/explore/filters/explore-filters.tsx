import { CurrencyFilter } from "./currency-filter"
import { DistributionFilter } from "./distribution-filter"
import { EngraverFilter } from "./engraver-filter"
import { IssueYearFilter } from "./issue-year-filter"
import { IssuerFilter } from "./issuer-filter"
import { RulingAuthorityFilter } from "./ruling-authority-filter"
import type {
  CoinDistribution,
  CoinListYear,
  CurrencyResponse,
  EngraverListItemResponse,
  IssuerResponse,
  RulingAuthorityListItemResponse,
} from "@workspace/api"

export function ExploreFilters({
  distribution,
  currencies,
  currencySlug,
  engraverSlug,
  engravers,
  issuerCode,
  issuers,
  rulingAuthorities,
  rulingAuthoritySlug,
  year,
}: {
  distribution?: CoinDistribution
  currencies: Array<CurrencyResponse>
  currencySlug?: string
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
  issuerCode?: string
  issuers: Array<IssuerResponse>
  rulingAuthorities: Array<RulingAuthorityListItemResponse>
  rulingAuthoritySlug?: string
  year?: CoinListYear
}) {
  return (
    <nav
      aria-label="Explore filters"
      className="flex min-h-18 flex-wrap items-start gap-3 border-b px-5 py-5 md:items-center md:gap-5 md:px-10"
    >
      <DistributionFilter distribution={distribution} />
      <IssuerFilter issuerCode={issuerCode} issuers={issuers} />
      <CurrencyFilter currencies={currencies} currencySlug={currencySlug} />
      <RulingAuthorityFilter
        rulingAuthoritySlug={rulingAuthoritySlug}
        rulingAuthorities={rulingAuthorities}
      />
      <EngraverFilter engraverSlug={engraverSlug} engravers={engravers} />
      <IssueYearFilter year={year} />
    </nav>
  )
}
