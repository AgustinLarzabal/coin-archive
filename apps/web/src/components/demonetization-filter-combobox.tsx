import type { DemonetizationFilterValue } from "@workspace/db"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import { demonetizationFilterOptions } from "../lib/coin-search"

type DemonetizationFilterOption = (typeof demonetizationFilterOptions)[number]

type DemonetizationFilterComboboxProps = {
  onValueChange: (
    demonetization: DemonetizationFilterValue | undefined
  ) => Promise<void>
  selectedDemonetization: DemonetizationFilterValue | undefined
}

function isDemonetizationOptionEqual(
  left: DemonetizationFilterOption,
  right: DemonetizationFilterOption
) {
  return left.value === right.value
}

function getSelectedDemonetizationOption(
  demonetization: DemonetizationFilterValue | undefined
) {
  if (demonetization === undefined) {
    return null
  }

  return (
    demonetizationFilterOptions.find((option) => option.value === demonetization)
    ?? null
  )
}

export function DemonetizationFilterCombobox({
  onValueChange,
  selectedDemonetization,
}: DemonetizationFilterComboboxProps) {
  const selectedOption = getSelectedDemonetizationOption(
    selectedDemonetization
  )

  return (
    <Combobox<DemonetizationFilterOption>
      items={demonetizationFilterOptions}
      value={selectedOption}
      itemToStringLabel={(option) => option.label}
      isItemEqualToValue={isDemonetizationOptionEqual}
      onValueChange={(option) => onValueChange(option?.value)}
    >
      <ComboboxInput placeholder="Filter by Demonetization Status" showClear />
      <ComboboxContent>
        <ComboboxEmpty>No Demonetization Status options found.</ComboboxEmpty>
        <ComboboxList>
          {(option: DemonetizationFilterOption) => (
            <ComboboxItem key={option.value} value={option}>
              <span>{option.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
