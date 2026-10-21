import { coinDistributionSchema } from "@coin-archive/api"
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

  return (
    <ExploreFilterCombobox
      label="Distribution"
      placeholder="All distributions"
      emptyMessage="No distributions found."
      options={distributions.map(({ slug, name }) => ({
        label: name,
        value: slug,
        disabled: !coinDistributionSchema.safeParse(slug).success,
      }))}
      name="distribution"
      value={distribution ?? null}
      onValueChange={(selectedDistribution: string | null) => {
        const nextDistribution = selectedDistribution
          ? (selectedDistribution as CoinDistribution)
          : undefined
        if (nextDistribution === distribution) return

        updateFilters({ distribution: nextDistribution })
      }}
    />
  )
}
