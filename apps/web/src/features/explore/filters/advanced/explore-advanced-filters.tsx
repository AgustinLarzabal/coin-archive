import { isIsoIssuerCode, issuerCodeSchema } from "@coin-archive/api"
import { Flag } from "@coin-archive/ui/components/flags/flag"
import { Filters } from "@coin-archive/ui/components/reui/filters/filters"
import {
  createFilterQuery,
  createFilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-query"
import { GlobeIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import type { IssuerResponse } from "@coin-archive/api"
import type {
  FilterField,
  FilterQuery,
  FilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-types"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

function queryFromFilters(issuerCode: string | undefined): FilterQuery<string> {
  return createFilterQuery([
    ...(issuerCode === undefined
      ? []
      : [
          createFilterRule({
            id: "explore-issuer",
            path: ["issuer"],
            operator: "is",
            value: issuerCode,
          }),
        ]),
  ])
}

export function ExploreAdvancedFilters({
  issuerCode,
  issuers,
}: {
  issuerCode?: string
  issuers: Array<IssuerResponse>
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const [query, setQuery] = useState(() => queryFromFilters(issuerCode))
  const fields: FilterField<string>[] = [
    {
      id: "issuer",
      label: "Issuer",
      icon: <GlobeIcon />,
      pinSelected: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "issuer"
      ),
      type: "select",
      autoSelectOperator: true,
      operators: [{ value: "is", label: "is" }],
      options: issuers.map((issuer) => ({
        label: issuer.name,
        value: issuer.code,
        icon: isIsoIssuerCode(issuer.code) ? (
          <Flag code={issuer.code} width={16} decorative />
        ) : undefined,
      })),
    },
  ]

  useEffect(() => {
    setQuery(queryFromFilters(issuerCode))
  }, [issuerCode])

  return (
    <nav
      aria-label="ReUI filter experiment"
      className="flex flex-wrap items-start gap-3 border-b px-5 py-4 md:items-center md:gap-5 md:px-10"
    >
      <Filters
        fields={fields}
        query={query}
        onQueryChange={(next) => {
          setQuery(next)
          const rule = next.rules.find(
            (node): node is FilterRule<string> =>
              node.type === "rule" && node.path[0] === "issuer"
          )
          if (rule && (rule.operator !== "is" || rule.value === undefined)) {
            return
          }
          const parsed = issuerCodeSchema.safeParse(rule?.value)
          if (rule && !parsed.success) return
          const value = parsed.success ? parsed.data : undefined
          if (value !== issuerCode) updateFilters({ issuer: value })
        }}
        showClear
      />
    </nav>
  )
}
