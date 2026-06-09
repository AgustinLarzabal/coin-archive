import {
  demonetizationFilterOptions,
  type DemonetizationFilterOption,
} from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type DemonetizationFilterComboboxProps = {
  onValueChange: (
    demonetization: DemonetizationFilterOption | null
  ) => Promise<void>
  selectedDemonetization: DemonetizationFilterOption | null
}

export function DemonetizationFilterCombobox({
  onValueChange,
  selectedDemonetization,
}: DemonetizationFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<DemonetizationFilterOption>
      emptyMessage="No Demonetization Status values found."
      items={[...demonetizationFilterOptions]}
      itemToStringLabel={(option) => option.name}
      onValueChange={onValueChange}
      placeholder="Filter by demonetization status"
      selectedItem={selectedDemonetization}
    />
  )
}
