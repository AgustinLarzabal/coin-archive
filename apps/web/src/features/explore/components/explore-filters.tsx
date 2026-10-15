import { EngraverCombobox } from "./explore-filters-engraver-combobox"
import { IssuerCombobox } from "./explore-filters-issuer-combobox"
import { YearFilter } from "./explore-filters-year"
import type { EngraverListItemResponse, IssuerResponse } from "@workspace/api"

export function ExploreFilters({
  engraverSlug,
  engravers,
  issuerCode,
  issuers,
  year,
}: {
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
  issuerCode?: string
  issuers: Array<IssuerResponse>
  year?: number
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
        year={year}
      />
      <EngraverCombobox
        engraverSlug={engraverSlug}
        engravers={engravers}
        issuerCode={issuerCode}
        year={year}
      />
      <YearFilter
        engraverSlug={engraverSlug}
        issuerCode={issuerCode}
        year={year}
      />
    </nav>
  )
}
