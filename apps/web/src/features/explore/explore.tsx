import { useSuspenseQuery } from "@tanstack/react-query"

import { ExploreGrid } from "./components/explore-grid"
import { ExplorePagination } from "./components/explore-pagination"
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
    const message =
      issuer && engraver
        ? `No coins found for ${issuer.name} engraved by ${engraver.fullName}.`
        : engraver
          ? `No coins found engraved by ${engraver.fullName}.`
          : issuer
            ? `No coins found for ${issuer.name}`
            : "No coins have been added to the archive yet"

    return <RouteMessage>{message}</RouteMessage>
  }

  return (
    <>
      <ExploreGrid coins={data.coins} />
      <ExplorePagination filters={filters} pagination={data.pagination} />
    </>
  )
}
