import { AmountFilter } from "./amount-filter"

export function ExploreBasicFilters({
  amount,
  currencySlug,
}: {
  amount?: string
  currencySlug?: string
}) {
  return (
    <nav
      aria-label="Explore filters"
      className="flex min-h-18 flex-wrap items-start gap-3 border-b px-5 py-5 md:items-center md:gap-5 md:px-10"
    >
      <AmountFilter
        amount={amount}
        currencySelected={currencySlug !== undefined}
      />
    </nav>
  )
}
