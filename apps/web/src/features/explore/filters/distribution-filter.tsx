import { coinDistributionSchema } from "@workspace/api"
import type { CoinDistribution } from "@workspace/api"

import { coinDistributionLabels } from "@/features/coin-distribution"
import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"
import { ExploreFilterCombobox } from "@/features/explore/filters/explore-filter-combobox"

const distributionOptions = coinDistributionSchema.options.map((value) => ({
  label: coinDistributionLabels[value],
  value,
}))
export function DistributionFilter({
  distribution,
}: {
  distribution?: CoinDistribution
}) {
  const { updateFilters } = useExploreSearchNavigation()

  return (
    <ExploreFilterCombobox
      label="Distribution"
      placeholder="All distributions"
      emptyMessage="No distributions found."
      options={distributionOptions}
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
