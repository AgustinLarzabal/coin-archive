import { EngraverCombobox } from "./explore-filters-engraver-combobox"
import { IssuerSelect } from "./explore-filters-issuer-select"
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
    <nav className="flex h-18 items-center gap-3 border-b px-5 md:px-10">
      <IssuerSelect
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
