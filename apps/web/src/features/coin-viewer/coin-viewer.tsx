import { useSuspenseQuery } from "@tanstack/react-query"

import { CoinViewerHeader } from "./coin-viewer-header"
import { CoinViewerLayout } from "./coin-viewer-layout"
import type { ExploreSearch } from "@/features/explore/explore-search"
import { coinDetailQueryOptions } from "@/data/archive"

export function CoinViewer({
  search,
  ...identity
}: { search: ExploreSearch } & (
  | { coinId: string; coinSlug?: never }
  | { coinSlug: string; coinId?: never }
)) {
  const { data: coin } = useSuspenseQuery(
    coinDetailQueryOptions(
      identity.coinSlug !== undefined ? identity.coinSlug : identity.coinId,
      identity.coinSlug !== undefined
    )
  )

  return (
    <>
      <CoinViewerHeader title={coin.title} search={search} />
      <main className="flex flex-1">
        <CoinViewerLayout coin={coin} />
      </main>
    </>
  )
}
