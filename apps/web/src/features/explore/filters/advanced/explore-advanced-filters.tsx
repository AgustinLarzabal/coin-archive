import {
  engraverSlugSchema,
  isIsoIssuerCode,
  issuerCodeSchema,
} from "@coin-archive/api"
import { Flag } from "@coin-archive/ui/components/flags/flag"
import { Filters } from "@coin-archive/ui/components/reui/filters/filters"
import {
  createFilterQuery,
  createFilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-query"
import { GlobeIcon, PenNibIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import type {
  EngraverListItemResponse,
  IssuerResponse,
} from "@coin-archive/api"
import type {
  FilterField,
  FilterQuery,
  FilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-types"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

function queryFromFilters(
  issuerCode: string | undefined,
  engraverSlug: string | undefined
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
    ...(engraverSlug === undefined
      ? []
      : [
          createFilterRule({
            id: "explore-engraver",
            path: ["engraver"],
            operator: "is",
            value: engraverSlug,
          }),
        ]),
  ])
}

export function ExploreAdvancedFilters({
  engraverSlug,
  engravers,
  issuerCode,
  issuers,
}: {
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
  issuerCode?: string
  issuers: Array<IssuerResponse>
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const [query, setQuery] = useState(() =>
    queryFromFilters(issuerCode, engraverSlug)
  )
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
    {
      id: "engraver",
      label: "Engraver",
      icon: <PenNibIcon />,
      pinSelected: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "engraver"
      ),
      type: "select",
      operators: [{ value: "is", label: "is" }],
      options: [
        ...engravers.map((engraver) => ({
          label: engraver.fullName,
          value: engraver.slug,
        })),
        ...(engraverSlug &&
        !engravers.some((engraver) => engraver.slug === engraverSlug)
          ? [
              {
                label: `Unknown engraver (${engraverSlug})`,
                value: engraverSlug,
                disabled: true,
              },
            ]
          : []),
      ],
    },
  ]

  useEffect(() => {
    setQuery(queryFromFilters(issuerCode, engraverSlug))
  }, [issuerCode, engraverSlug])

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
          const patch: { issuer?: string; engraver?: string } = {}
          for (const [field, current, schema] of [
            ["issuer", issuerCode, issuerCodeSchema],
            ["engraver", engraverSlug, engraverSlugSchema],
          ] as const) {
            const rule = next.rules.find(
              (node): node is FilterRule<string> =>
                node.type === "rule" && node.path[0] === field
            )
            if (rule && (rule.operator !== "is" || rule.value === undefined)) {
              continue
            }
            const parsed = schema.safeParse(rule?.value)
            if (rule && !parsed.success) continue
            const value = parsed.success ? parsed.data : undefined
            if (value !== current) patch[field] = value
          }
          if (Object.keys(patch).length > 0) updateFilters(patch)
        }}
        showClear
      />
    </nav>
  )
}
