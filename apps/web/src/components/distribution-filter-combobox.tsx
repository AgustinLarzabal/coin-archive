import type { DistributionOption } from "@workspace/db"
import { getDistributionOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type DistributionFilterComboboxProps = {
  distributions: DistributionOption[]
  onValueChange: (distribution: DistributionOption | null) => Promise<void>
  selectedDistribution: DistributionOption | null
}

export function DistributionFilterCombobox({
  distributions,
  onValueChange,
  selectedDistribution,
}: DistributionFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<DistributionOption>
      emptyMessage="No distributions found."
      items={distributions}
      itemToStringLabel={getDistributionOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by distribution"
      selectedItem={selectedDistribution}
    />
  )
}
