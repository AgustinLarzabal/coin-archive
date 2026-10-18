import type { CurrencyResponse } from "@workspace/api"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"
import { ExploreFilterCombobox } from "@/features/explore/filters/explore-filter-combobox"

export function CurrencyFilter({
  currencies,
  currencySlug,
}: {
  currencies: Array<CurrencyResponse>
  currencySlug?: string
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const unknownCurrencySlug =
    currencySlug &&
    !currencies.some((currency) => currency.slug === currencySlug)
      ? currencySlug
      : undefined
  const options = [
    ...currencies.map((currency) => ({
      label: currency.fullName,
      value: currency.slug,
    })),
    ...(unknownCurrencySlug
      ? [
          {
            disabled: true,
            label: `Unknown Currency (${unknownCurrencySlug})`,
            value: unknownCurrencySlug,
          },
        ]
      : []),
  ]

  return (
    <ExploreFilterCombobox
      id="currency-filter"
      label="Currency"
      placeholder="All currencies"
      emptyMessage="No currencies found."
      options={options}
      name="currency"
      value={currencySlug ?? null}
      onValueChange={(currency: string | null) => {
        const nextCurrencySlug = currency || undefined
        if (nextCurrencySlug === currencySlug) return
        updateFilters({ currency: nextCurrencySlug, amount: undefined })
      }}
    />
  )
}
