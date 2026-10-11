import { useSuspenseQuery } from "@tanstack/react-query"

import { ExploreGrid } from "./components/explore-grid"
import type { CoinListFilters } from "@/data/archive"
import type { EngraverListItemResponse, IssuerResponse } from "@workspace/api"
import { RouteMessage } from "@/components/route-message"
import { coinListQueryOptions } from "@/data/archive"

export function Explore({
  filters,
  engraver,
  issuer,
}: {
  filters: CoinListFilters
  engraver?: EngraverListItemResponse
  issuer?: IssuerResponse
}) {
  const { data } = useSuspenseQuery(coinListQueryOptions(filters))

  if (data.coins.length === 0) {
    return (
      <RouteMessage>
        {issuer || engraver
          ? `No coins found for ${[issuer?.name, engraver?.fullName]
              .filter(Boolean)
              .join(" and ")}`
          : "No coins have been added to the archive yet"}
      </RouteMessage>
    )
  }

  return <ExploreGrid coins={data.coins} />
}
