import { useSuspenseQuery } from "@tanstack/react-query"

import { ExploreGrid } from "./explore-grid"
import { ExplorePagination } from "./explore-pagination"
import type { CoinListFilters } from "@/data/archive"
import { RouteMessage } from "@/components/route-message"
import { coinListQueryOptions } from "@/data/archive"

export function Explore({ filters }: { filters: CoinListFilters }) {
  const { data } = useSuspenseQuery(coinListQueryOptions(filters))

  if (data.coins.length === 0) {
    const message =
      filters.issuerCode !== undefined ||
      filters.distribution !== undefined ||
      filters.engraverSlug !== undefined ||
      filters.rulingAuthoritySlug !== undefined ||
      filters.issueYear !== undefined
        ? "No coins match the selected filters."
        : "No coins have been added to the archive yet"

    return <RouteMessage>{message}</RouteMessage>
  }

  return (
    <>
      <ExploreGrid coins={data.coins} />
      <ExplorePagination pagination={data.pagination} />
    </>
  )
}
