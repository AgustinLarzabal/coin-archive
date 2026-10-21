import { ExploreFilterCombobox } from "./explore-filter-combobox"
import type {
  CoinDistribution,
  DistributionListItemResponse,
} from "@coin-archive/api"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

export function DistributionFilter({
  distribution,
  distributions,
}: {
  distribution?: CoinDistribution
  distributions: Array<DistributionListItemResponse>
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const unknownDistribution =
    distribution && !distributions.some(({ slug }) => slug === distribution)
      ? distribution
      : undefined
  const options = [
    ...distributions.map(({ slug, name }) => ({ label: name, value: slug })),
    ...(unknownDistribution
      ? [
          {
            label: `Unknown Distribution (${unknownDistribution})`,
            value: unknownDistribution,
            disabled: true,
          },
        ]
      : []),
  ]

  return (
    <ExploreFilterCombobox
      label="Distribution"
      placeholder="All distributions"
      emptyMessage="No distributions found."
      options={options}
      name="distribution"
      value={distribution ?? null}
      onValueChange={(selectedDistribution: string | null) => {
        const nextDistribution = selectedDistribution ?? undefined
        if (nextDistribution === distribution) return

        updateFilters({ distribution: nextDistribution })
      }}
    />
  )
}
