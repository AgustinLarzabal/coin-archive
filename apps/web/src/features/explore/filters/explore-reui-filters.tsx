import { coinDistributionSchema } from "@coin-archive/api"
import { Filters } from "@coin-archive/ui/components/reui/filters/filters"
import {
  createFilterQuery,
  createFilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-query"
import { useEffect, useState } from "react"
import type { CoinDistribution } from "@coin-archive/api"
import type {
  FilterField,
  FilterQuery,
} from "@coin-archive/ui/components/reui/filters/filters-types"

import { coinDistributionLabels } from "@/features/coin-distribution"
import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

const fields: FilterField<string>[] = [
  {
    id: "distribution",
    label: "Coin Distribution",
    type: "select",
    operators: [{ value: "is", label: "is" }],
    options: coinDistributionSchema.options.map((value) => ({
      label: coinDistributionLabels[value],
      value,
    })),
  },
]

function queryFromDistribution(
  distribution: CoinDistribution | undefined
): FilterQuery<string> {
  return createFilterQuery(
    distribution === undefined
      ? []
      : [
          createFilterRule({
            id: "explore-distribution",
            path: ["distribution"],
            operator: "is",
            value: distribution,
          }),
        ]
  )
}

export function ExploreReuiFilters({
  distribution,
}: {
  distribution?: CoinDistribution
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const [query, setQuery] = useState(() => queryFromDistribution(distribution))

  useEffect(() => {
    setQuery(queryFromDistribution(distribution))
  }, [distribution])

  return (
    <section
      aria-label="ReUI filter experiment"
      className="flex flex-col gap-3 border-b px-5 py-5 md:px-10"
    >
      <Filters
        fields={fields}
        query={query}
        onBeforeQueryChange={(next) =>
          next.combinator === "and" &&
          next.rules.length <= 1 &&
          next.rules.every(
            (node) =>
              node.type === "rule" &&
              node.path.length === 1 &&
              node.path[0] === "distribution" &&
              (node.operator === "" || node.operator === "is") &&
              !node.negated
          )
        }
        onQueryChange={(next) => {
          setQuery(next)
          const rule = next.rules.at(0)
          if (rule && rule.type === "rule" && rule.operator === "") return

          const parsed = coinDistributionSchema.safeParse(
            rule && rule.type === "rule" ? rule.value : undefined
          )
          const nextDistribution = parsed.success ? parsed.data : undefined
          if (nextDistribution !== distribution) {
            updateFilters({ distribution: nextDistribution })
          }
        }}
        showClear
      />
    </section>
  )
}
