import {
  isIsoIssuerCode,
  issuerCodeSchema,
  rulingAuthoritySlugSchema,
} from "@coin-archive/api"
import { Flag } from "@coin-archive/ui/components/flags/flag"
import { Filters } from "@coin-archive/ui/components/reui/filters/filters"
import {
  createFilterQuery,
  createFilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-query"
import { CrownIcon, GlobeIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import type {
  IssuerResponse,
  RulingAuthorityListItemResponse,
} from "@coin-archive/api"
import type {
  FilterField,
  FilterQuery,
  FilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-types"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

function queryFromFilters(
  issuerCode: string | undefined,
  rulingAuthoritySlug: string | undefined
): FilterQuery<string> {
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
    ...(rulingAuthoritySlug === undefined
      ? []
      : [
          createFilterRule({
            id: "explore-ruler",
            path: ["ruler"],
            operator: "is",
            value: rulingAuthoritySlug,
          }),
        ]),
  ])
}

export function ExploreAdvancedFilters({
  issuerCode,
  issuers,
  rulingAuthoritySlug,
  rulingAuthorities,
}: {
  issuerCode?: string
  issuers: Array<IssuerResponse>
  rulingAuthoritySlug?: string
  rulingAuthorities: Array<RulingAuthorityListItemResponse>
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const [query, setQuery] = useState(() =>
    queryFromFilters(issuerCode, rulingAuthoritySlug)
  )
  const nameCounts = new Map<string, number>()
  for (const ruler of rulingAuthorities) {
    nameCounts.set(ruler.name, (nameCounts.get(ruler.name) ?? 0) + 1)
  }
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
    {
      id: "ruler",
      label: "Ruler / Period",
      icon: <CrownIcon />,
      pinSelected: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "ruler"
      ),
      type: "select",
      autoSelectOperator: true,
      operators: [{ value: "is", label: "is" }],
      options: rulingAuthorities.map((ruler) => ({
        label:
          nameCounts.get(ruler.name) === 1
            ? ruler.name
            : `${ruler.name} (${ruler.slug})`,
        value: ruler.slug,
      })),
    },
  ]

  useEffect(() => {
    setQuery(queryFromFilters(issuerCode, rulingAuthoritySlug))
  }, [issuerCode, rulingAuthoritySlug])

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
          const rule = (field: string) =>
            next.rules.find(
              (node): node is FilterRule<string> =>
                node.type === "rule" && node.path[0] === field
            )
          const issuer = rule("issuer")
          const ruler = rule("ruler")
          const nextIssuer = issuerCodeSchema.safeParse(issuer?.value)
          const nextRuler = rulingAuthoritySlugSchema.safeParse(ruler?.value)
          const patch: { issuer?: string; ruler?: string } = {}
          if (!issuer || (issuer.operator === "is" && nextIssuer.success)) {
            if (nextIssuer.data !== issuerCode) patch.issuer = nextIssuer.data
          }
          if (!ruler || (ruler.operator === "is" && nextRuler.success)) {
            if (nextRuler.data !== rulingAuthoritySlug)
              patch.ruler = nextRuler.data
          }
          if (Object.keys(patch).length) updateFilters(patch)
        }}
        showClear
      />
    </nav>
  )
}
