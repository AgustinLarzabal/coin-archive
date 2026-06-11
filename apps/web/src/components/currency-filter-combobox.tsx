import type { CurrencyOption } from "@workspace/db"
import { getCurrencyOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type CurrencyFilterComboboxProps = {
  currencies: CurrencyOption[]
  onValueChange: (currency: CurrencyOption | null) => Promise<void>
  selectedCurrency: CurrencyOption | null
}

export function CurrencyFilterCombobox({
  currencies,
  onValueChange,
  selectedCurrency,
}: CurrencyFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<CurrencyOption>
      emptyMessage="No currencies found."
      items={currencies}
      itemToStringLabel={getCurrencyOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by currency"
      selectedItem={selectedCurrency}
    />
  )
}
