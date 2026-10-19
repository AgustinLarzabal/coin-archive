import { coinDistributionSchema } from "@coin-archive/api"
import { ExploreFilterCombobox } from "./explore-filter-combobox"
import type { CoinDistribution } from "@coin-archive/api"

import { coinDistributionLabels } from "@/features/coin-distribution"
import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

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
