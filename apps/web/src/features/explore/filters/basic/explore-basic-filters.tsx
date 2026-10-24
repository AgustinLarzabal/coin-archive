import { AmountFilter } from "./amount-filter"
import { EngraverFilter } from "./engraver-filter"
import { IssueYearFilter } from "./issue-year-filter"
import type { CoinListYear, EngraverListItemResponse } from "@coin-archive/api"

export function ExploreBasicFilters({
  amount,
  currencySlug,
  engraverSlug,
  engravers,
  year,
}: {
  amount?: string
  currencySlug?: string
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
  year?: CoinListYear
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
      <EngraverFilter engraverSlug={engraverSlug} engravers={engravers} />
      <IssueYearFilter year={year} />
    </nav>
  )
}
