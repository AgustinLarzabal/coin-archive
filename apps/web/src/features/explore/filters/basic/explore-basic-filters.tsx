import { AmountFilter } from "./amount-filter"
import { DistributionFilter } from "./distribution-filter"
import { EngraverFilter } from "./engraver-filter"
import { IssueYearFilter } from "./issue-year-filter"
import { MintFilter } from "./mint-filter"
import type {
  CoinDistribution,
  CoinListYear,
  DistributionListItemResponse,
  EngraverListItemResponse,
  MintResponse,
} from "@coin-archive/api"

export function ExploreBasicFilters({
  amount,
  distribution,
  distributions,
  currencySlug,
  engraverSlug,
  engravers,
  mintSlug,
  mints,
  year,
}: {
  amount?: string
  distribution?: CoinDistribution
  distributions: Array<DistributionListItemResponse>
  currencySlug?: string
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
  mintSlug?: string
  mints: Array<MintResponse>
  year?: CoinListYear
}) {
  return (
    <nav
      aria-label="Explore filters"
      className="flex min-h-18 flex-wrap items-start gap-3 border-b px-5 py-5 md:items-center md:gap-5 md:px-10"
    >
      <DistributionFilter
        distribution={distribution}
        distributions={distributions}
      />
      <MintFilter mintSlug={mintSlug} mints={mints} />
      <AmountFilter
        amount={amount}
        currencySelected={currencySlug !== undefined}
      />
      <EngraverFilter engraverSlug={engraverSlug} engravers={engravers} />
      <IssueYearFilter year={year} />
    </nav>
  )
}
