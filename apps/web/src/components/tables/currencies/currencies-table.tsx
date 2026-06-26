import { useMemo, useState } from "react"
import type { CurrencyOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createCurrencyColumns } from "./columns"
import { CurrencyMaintenanceSheet } from "./currency-maintenance-sheet"
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
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption | null>(
    null
  )
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [filterValue, setFilterValue] = useState("")
  const columns = useMemo(
    () =>
      createCurrencyColumns((currency) => {
        setSelectedCurrency(currency)
        setIsMaintenanceSheetOpen(true)
      }),
    []
  )
  const filteredCurrencies = filterCurrencies(currencies, filterValue)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedCurrency(null)
    }
  }

  function handleCreateCurrency() {
    setSelectedCurrency(null)
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredCurrencies}
        toolbar={() => (
          <CurrenciesTableToolbar
            filterValue={filterValue}
            onCreateCurrency={handleCreateCurrency}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <CurrencyMaintenanceSheet
        currency={selectedCurrency}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
