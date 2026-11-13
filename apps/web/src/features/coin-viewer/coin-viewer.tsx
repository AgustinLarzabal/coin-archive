import { useSuspenseQuery } from "@tanstack/react-query"

import { CoinViewerHeader } from "./coin-viewer-header"
import { CoinViewerLayout } from "./coin-viewer-layout"
import type { ExploreSearch } from "@/features/explore/explore-search"
import { coinDetailQueryOptions } from "@/data/archive"

export function CoinViewer({
  search,
  coinSlug,
}: { search: ExploreSearch; coinSlug: string }) {
  const { data: coin } = useSuspenseQuery(
    coinDetailQueryOptions(coinSlug, true)
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
