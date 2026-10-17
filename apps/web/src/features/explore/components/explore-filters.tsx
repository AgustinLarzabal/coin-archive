import { DistributionFilter } from "./explore-filters-distribution"
import { EngraverCombobox } from "./explore-filters-engraver-combobox"
import { IssuerCombobox } from "./explore-filters-issuer-combobox"
import { RulerCombobox } from "./explore-filters-ruler-combobox"
import { YearFilter } from "./explore-filters-year"
import type {
  CoinDistribution,
  CoinListYear,
  EngraverListItemResponse,
  IssuerResponse,
  RulingAuthorityListItemResponse,
} from "@workspace/api"

export function ExploreFilters({
  distribution,
  engraverSlug,
  engravers,
  issuerCode,
  issuers,
  rulerSlug,
  rulers,
  year,
}: {
  distribution?: CoinDistribution
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
  issuerCode?: string
  issuers: Array<IssuerResponse>
  rulerSlug?: string
  rulers: Array<RulingAuthorityListItemResponse>
  year?: CoinListYear
}) {
  return (
    <nav
      aria-label="Explore filters"
      className="flex min-h-18 flex-wrap items-start gap-3 border-b px-5 py-5 md:items-center md:gap-5 md:px-10"
    >
      <DistributionFilter distribution={distribution} />
      <IssuerCombobox issuerCode={issuerCode} issuers={issuers} />
      <RulerCombobox rulerSlug={rulerSlug} rulers={rulers} />
      <EngraverCombobox engraverSlug={engraverSlug} engravers={engravers} />
      <YearFilter year={year} />
    </nav>
  )
}
