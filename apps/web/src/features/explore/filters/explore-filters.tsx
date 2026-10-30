import {
  coinDistributionSchema,
  currencySlugSchema,
  engraverSlugSchema,
  isIsoIssuerCode,
  issuerCodeSchema,
  mintSlugSchema,
  rulingAuthoritySlugSchema,
} from "@coin-archive/api"
import { Flag } from "@coin-archive/ui/components/flags/flag"
import { Filters } from "@coin-archive/ui/components/reui/filters/filters"
import {
  createFilterQuery,
  createFilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-query"
import {
  CoinsIcon,
  CrownIcon,
  GlobeIcon,
  MapPinIcon,
  PencilSimpleIcon,
  StackIcon,
} from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import type {
  CurrencyResponse,
  DistributionListItemResponse,
  EngraverListItemResponse,
  IssuerResponse,
  MintResponse,
  RulingAuthorityListItemResponse,
} from "@coin-archive/api"
import type {
  FilterField,
  FilterQuery,
  FilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-types"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

const filterSchemas = {
  currency: currencySlugSchema,
  distribution: coinDistributionSchema,
  engraver: engraverSlugSchema,
  issuer: issuerCodeSchema,
  mint: mintSlugSchema,
  ruler: rulingAuthoritySlugSchema,
}

function filterQuery(
  currencySlug: string | undefined,
  distribution: string | undefined,
  engraverSlug: string | undefined,
  issuerCode: string | undefined,
  mintSlug: string | undefined,
  rulingAuthoritySlug: string | undefined
) {
  const filters = {
    currency: currencySlug,
    distribution,
    engraver: engraverSlug,
    issuer: issuerCode,
    mint: mintSlug,
    ruler: rulingAuthoritySlug,
  }
  const rules = Object.entries(filters).flatMap(([name, value]) => {
    if (value === undefined) return []

    const rule = createFilterRule({
      id: `explore-${name}`,
      path: [name],
      operator: "is",
      value,
    })

    return [rule]
  })

  return createFilterQuery<string>(rules)
}

export function ExploreFilters({
  currencies,
  currencySlug,
  distributions,
  distribution,
  engravers,
  engraverSlug,
  issuers,
  issuerCode,
  mints,
  mintSlug,
  rulingAuthorities,
  rulingAuthoritySlug,
}: {
  currencies: Array<CurrencyResponse>
  currencySlug: string | undefined
  distributions: Array<DistributionListItemResponse>
  distribution: string | undefined
  engravers: Array<EngraverListItemResponse>
  engraverSlug: string | undefined
  issuers: Array<IssuerResponse>
  issuerCode: string | undefined
  mints: Array<MintResponse>
  mintSlug: string | undefined
  rulingAuthorities: Array<RulingAuthorityListItemResponse>
  rulingAuthoritySlug: string | undefined
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const [query, setQuery] = useState(() =>
    filterQuery(
      currencySlug,
      distribution,
      engraverSlug,
      issuerCode,
      mintSlug,
      rulingAuthoritySlug
    )
  )

  useEffect(
    () =>
      setQuery(
        filterQuery(
          currencySlug,
          distribution,
          engraverSlug,
          issuerCode,
          mintSlug,
          rulingAuthoritySlug
        )
      ),
    [
      currencySlug,
      distribution,
      engraverSlug,
      issuerCode,
      mintSlug,
      rulingAuthoritySlug,
    ]
  )

  const mintNameCounts = new Map<string, number>()
  for (const mint of mints) {
    mintNameCounts.set(mint.name, (mintNameCounts.get(mint.name) ?? 0) + 1)
  }
  const rulerNameCounts = new Map<string, number>()
  for (const ruler of rulingAuthorities) {
    rulerNameCounts.set(ruler.name, (rulerNameCounts.get(ruler.name) ?? 0) + 1)
  }

  const fields: FilterField<string>[] = [
    {
      id: "currency",
      label: "Currency",
      icon: <CoinsIcon />,
      type: "select",
      options: currencies.map(({ slug, fullName }) => ({
        label: fullName,
        value: slug,
      })),
      pinSelected: true,
      operators: [{ value: "is", label: "is" }],
      defaultOperator: "is",
      autoSelectOperator: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "currency"
      ),
    },
    {
      id: "distribution",
      label: "Distribution",
      icon: <StackIcon />,
      type: "select",
      options: distributions.map(({ slug, name }) => ({
        label: name,
        value: slug,
      })),
      pinSelected: true,
      operators: [{ value: "is", label: "is" }],
      defaultOperator: "is",
      autoSelectOperator: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "distribution"
      ),
    },
    {
      id: "engraver",
      label: "Engraver",
      icon: <PencilSimpleIcon />,
      type: "select",
      options: [
        ...engravers.map(({ fullName, slug }) => ({
          label: fullName,
          value: slug,
        })),
        ...(engraverSlug && !engravers.some(({ slug }) => slug === engraverSlug)
          ? [
              {
                label: `Unknown engraver (${engraverSlug})`,
                value: engraverSlug,
                disabled: true,
              },
            ]
          : []),
      ],
      pinSelected: true,
      operators: [{ value: "is", label: "is" }],
      defaultOperator: "is",
      autoSelectOperator: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "engraver"
      ),
    },
    {
      id: "issuer",
      label: "Issuer",
      icon: <GlobeIcon />,
      type: "select",
      options: issuers.map((issuer) => ({
        label: issuer.name,
        value: issuer.code,
        icon: isIsoIssuerCode(issuer.code) ? (
          <Flag code={issuer.code} width={16} decorative />
        ) : undefined,
      })),
      pinSelected: true,
      operators: [{ value: "is", label: "is" }],
      defaultOperator: "is",
      autoSelectOperator: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "issuer"
      ),
    },
    {
      id: "mint",
      label: "Mint",
      icon: <MapPinIcon />,
      type: "select",
      options: [
        ...mints.map((mint) => ({
          label:
            mintNameCounts.get(mint.name) === 1
              ? mint.name
              : `${mint.name} (${mint.place}, ${mint.country.name}; ${mint.slug})`,
          value: mint.slug,
        })),
        ...(mintSlug && !mints.some((mint) => mint.slug === mintSlug)
          ? [
              {
                label: `Unknown Mint (${mintSlug})`,
                value: mintSlug,
                disabled: true,
              },
            ]
          : []),
      ],
      pinSelected: true,
      operators: [{ value: "is", label: "is" }],
      defaultOperator: "is",
      autoSelectOperator: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "mint"
      ),
    },
    {
      id: "ruler",
      label: "Ruler / Period",
      icon: <CrownIcon />,
      type: "select",
      options: rulingAuthorities.map(({ slug, name }) => ({
        label: rulerNameCounts.get(name) === 1 ? name : `${name} (${slug})`,
        value: slug,
      })),
      pinSelected: true,
      operators: [{ value: "is", label: "is" }],
      defaultOperator: "is",
      autoSelectOperator: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "ruler"
      ),
    },
  ]

  return (
    <Filters
      fields={fields}
      query={query}
      onQueryChange={(next: FilterQuery<string>) => {
        const current = {
          currency: currencySlug,
          distribution,
          engraver: engraverSlug,
          issuer: issuerCode,
          mint: mintSlug,
          ruler: rulingAuthoritySlug,
        }
        const selected = { ...current }
        const names = Object.keys(filterSchemas) as Array<
          keyof typeof filterSchemas
        >
        setQuery(next)

        for (const name of names) {
          const rule = next.rules.find(
            (node): node is FilterRule<string> =>
              node.type === "rule" && node.path[0] === name
          )
          if (!rule) {
            selected[name] = undefined
            continue
          }

          const parsed = filterSchemas[name].safeParse(rule.value)
          if (rule.operator !== "is" || !parsed.success) return
          selected[name] = parsed.data
        }

        if (names.every((name) => selected[name] === current[name])) return
        updateFilters(selected)
      }}
      onBeforeQueryChange={(next) => {
        if (next.rules.length > fields.length || next.combinator !== "and")
          return false
        if (next.rules.some((rule) => rule.type !== "rule")) return false
        const paths = next.rules.map((rule) =>
          rule.type === "rule" ? rule.path[0] : undefined
        )
        return (
          paths.every(
            (path) =>
              path === undefined || fields.some((field) => field.id === path)
          ) &&
          new Set(paths.filter(Boolean)).size === paths.filter(Boolean).length
        )
      }}
      showClear
    />
  )
}
