import { useSuspenseQuery } from "@tanstack/react-query"

import { ExploreGrid } from "./components/explore-grid"
import { ExplorePagination } from "./components/explore-pagination"
import type { CoinListFilters } from "@/data/archive"
import type { EngraverListItemResponse, IssuerResponse } from "@workspace/api"
import { RouteMessage } from "@/components/route-message"
import { coinListQueryOptions } from "@/data/archive"
import { formatCoinListYear } from "@/features/issue-period"

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
  const issueYear =
    filters.issueYear === undefined
      ? undefined
      : formatCoinListYear(filters.issueYear)
  const issueYearRelationship =
    typeof filters.issueYear === "number" ? "containing" : "overlapping"

  if (data.coins.length === 0) {
    const message =
      issueYear !== undefined
        ? issuer && engraver
          ? `No coins found for ${issuer.name} engraved by ${engraver.fullName} with an Issue Period ${issueYearRelationship} ${issueYear}.`
          : engraver
            ? `No coins found engraved by ${engraver.fullName} with an Issue Period ${issueYearRelationship} ${issueYear}.`
            : issuer
              ? `No coins found for ${issuer.name} with an Issue Period ${issueYearRelationship} ${issueYear}.`
              : `No coins found with an Issue Period ${issueYearRelationship} ${issueYear}.`
        : issuer && engraver
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
