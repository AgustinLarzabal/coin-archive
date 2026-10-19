import { useSuspenseQuery } from "@tanstack/react-query"

import { CoinViewerHeader } from "./coin-viewer-header"
import { CoinViewerLayout } from "./coin-viewer-layout"
import type { ExploreSearch } from "@/features/explore/explore-search"
import { coinDetailQueryOptions } from "@/data/archive"

export function CoinViewer({
  coinId,
  search,
}: {
  coinId: string
  search: ExploreSearch
}) {
  const { data: coin } = useSuspenseQuery(coinDetailQueryOptions(coinId))

  return (
    <>
      <CoinViewerHeader title={coin.title} search={search} />
      <main className="flex flex-1">
        <CoinViewerLayout coin={coin} />
      </main>
    </>
  )
}
