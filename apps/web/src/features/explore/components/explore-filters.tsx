import { EngraverCombobox } from "./explore-filters-engraver-combobox"
import { IssuerCombobox } from "./explore-filters-issuer-combobox"
import type { EngraverListItemResponse, IssuerResponse } from "@workspace/api"

export function ExploreFilters({
  engraverSlug,
  engravers,
  issuerCode,
  issuers,
}: {
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
  issuerCode?: string
  issuers: Array<IssuerResponse>
}) {
  return (
    <nav
      aria-label="Explore filters"
      className="flex h-18 items-center gap-5 border-b px-5 md:px-10"
    >
      <IssuerCombobox
        engraverSlug={engraverSlug}
        issuerCode={issuerCode}
        issuers={issuers}
      />
      <EngraverCombobox
        engraverSlug={engraverSlug}
        engravers={engravers}
        issuerCode={issuerCode}
      />
    </nav>
  )
}
