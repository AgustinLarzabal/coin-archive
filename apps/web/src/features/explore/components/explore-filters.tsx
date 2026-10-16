import { EngraverCombobox } from "./explore-filters-engraver-combobox"
import { IssuerCombobox } from "./explore-filters-issuer-combobox"
import { RulerCombobox } from "./explore-filters-ruler-combobox"
import { YearFilter } from "./explore-filters-year"
import type {
  CoinListYear,
  EngraverListItemResponse,
  IssuerResponse,
  RulingAuthorityListItemResponse,
} from "@workspace/api"

export function ExploreFilters({
  engraverSlug,
  engravers,
  issuerCode,
  issuers,
  rulerSlug,
  rulers,
  year,
}: {
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
      <IssuerCombobox
        engraverSlug={engraverSlug}
        issuerCode={issuerCode}
        issuers={issuers}
        rulerSlug={rulerSlug}
        year={year}
      />
      <RulerCombobox
        engraverSlug={engraverSlug}
        issuerCode={issuerCode}
        rulerSlug={rulerSlug}
        rulers={rulers}
        year={year}
      />
      <EngraverCombobox
        engraverSlug={engraverSlug}
        engravers={engravers}
        issuerCode={issuerCode}
        rulerSlug={rulerSlug}
        year={year}
      />
      <YearFilter
        engraverSlug={engraverSlug}
        issuerCode={issuerCode}
        rulerSlug={rulerSlug}
        year={year}
      />
    </nav>
  )
}
