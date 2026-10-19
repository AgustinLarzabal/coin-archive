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
} from "@coin-archive/ui/components/reui/filters/filters-types"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

function queryFromIssuer(issuerCode: string | undefined): FilterQuery<string> {
  return createFilterQuery(
    issuerCode === undefined
      ? []
      : [
          createFilterRule({
            id: "explore-issuer",
            path: ["issuer"],
            operator: "is",
            value: issuerCode,
          }),
        ]
  )
}

export function ExploreAdvancedFilters({
  issuerCode,
  issuers,
}: {
  issuerCode?: string
  issuers: Array<IssuerResponse>
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const [query, setQuery] = useState(() => queryFromIssuer(issuerCode))
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
    setQuery(queryFromIssuer(issuerCode))
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
          const rule = next.rules.at(0)
          if (rule && rule.type === "rule" && rule.operator === "") return

          const parsed = issuerCodeSchema.safeParse(
            rule && rule.type === "rule" ? rule.value : undefined
          )
          const nextIssuerCode = parsed.success ? parsed.data : undefined
          if (nextIssuerCode !== issuerCode) {
            updateFilters({ issuer: nextIssuerCode })
          }
        }}
        showClear
      />
    </nav>
  )
}
