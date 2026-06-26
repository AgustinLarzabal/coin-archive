import { useState } from "react"
import type { CurrencyOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { currencyColumns } from "./columns"
import { CurrenciesTableToolbar } from "./currencies-table-toolbar"

type CurrenciesTableProps = {
  currencies: CurrencyOption[]
}

export function filterCurrencies(
  currencies: CurrencyOption[],
  filterValue: string
): CurrencyOption[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return currencies
  }

  return currencies.filter((currency) =>
    [currency.code, currency.name, currency.fullName].some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

export function CurrenciesTable({ currencies }: CurrenciesTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const filteredCurrencies = filterCurrencies(currencies, filterValue)

  return (
    <DataTable
      columns={currencyColumns}
      data={filteredCurrencies}
      toolbar={() => (
        <CurrenciesTableToolbar
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
        />
      )}
    />
  )
}
