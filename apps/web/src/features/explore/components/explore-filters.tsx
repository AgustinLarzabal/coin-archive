import { IssuerSelect } from "./explore-filters-issuer-select"
import type { IssuerResponse } from "@workspace/api"

export function ExploreFilters({
  engraverSlug,
  issuerCode,
  issuers,
}: {
  engraverSlug?: string
  issuerCode?: string
  issuers: Array<IssuerResponse>
}) {
  return (
    <nav className="flex h-18 items-center border-b px-5 md:px-10">
      <IssuerSelect
        engraverSlug={engraverSlug}
        issuerCode={issuerCode}
        issuers={issuers}
      />
    </nav>
  )
}
