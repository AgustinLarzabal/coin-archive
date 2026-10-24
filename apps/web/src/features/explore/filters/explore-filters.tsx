import {
  coinDistributionSchema,
  currencySlugSchema,
  engraverSlugSchema,
  faceValueAmountQuerySchema,
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
  CalendarBlankIcon,
  CoinsIcon,
  CrownIcon,
  GlobeIcon,
  HashIcon,
  MapPinIcon,
  PencilSimpleIcon,
  StackIcon,
} from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import type {
  CoinListYear,
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
import {
  formatIssueYearFilterValue,
  parseIssueYearFilterValue,
} from "@/features/explore/filters/issue-year-filter-value"

function queryFromFilters(
  amount: string | undefined,
  currencySlug: string | undefined,
  distribution: string | undefined,
  engraverSlug: string | undefined,
  issuerCode: string | undefined,
  mintSlug: string | undefined,
  rulingAuthoritySlug: string | undefined,
  year: CoinListYear | undefined
): FilterQuery<string> {
  return createFilterQuery([
    ...(amount === undefined
      ? []
      : [
          createFilterRule({
            id: "explore-amount",
            path: ["amount"],
            operator: "is",
            value: amount,
          }),
        ]),
    ...(currencySlug === undefined
      ? []
      : [
          createFilterRule({
            id: "explore-currency",
            path: ["currency"],
            operator: "is",
            value: currencySlug,
          }),
        ]),
    ...(distribution === undefined
      ? []
      : [
          createFilterRule({
            id: "explore-distribution",
            path: ["distribution"],
            operator: "is",
            value: distribution,
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
    ...(mintSlug === undefined
      ? []
      : [
          createFilterRule({
            id: "explore-mint",
            path: ["mint"],
            operator: "is",
            value: mintSlug,
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
    ...(year === undefined
      ? []
      : [
          createFilterRule({
            id: "explore-year",
            path: ["year"],
            operator: "is",
            value: formatIssueYearFilterValue(year),
          }),
        ]),
  ])
}

export function ExploreFilters({
  amount,
  currencies,
  currencySlug,
  distribution,
  distributions,
  engraverSlug,
  engravers,
  issuerCode,
  issuers,
  mintSlug,
  mints,
  rulingAuthoritySlug,
  rulingAuthorities,
  year,
}: {
  amount?: string
  currencies: Array<CurrencyResponse>
  currencySlug?: string
  distribution?: string
  distributions: Array<DistributionListItemResponse>
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
  issuerCode?: string
  issuers: Array<IssuerResponse>
  mintSlug?: string
  mints: Array<MintResponse>
  rulingAuthoritySlug?: string
  rulingAuthorities: Array<RulingAuthorityListItemResponse>
  year?: CoinListYear
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const [query, setQuery] = useState(() =>
    queryFromFilters(
      amount,
      currencySlug,
      distribution,
      engraverSlug,
      issuerCode,
      mintSlug,
      rulingAuthoritySlug,
      year
    )
  )
  const mintNameCounts = new Map<string, number>()
  for (const mint of mints) {
    mintNameCounts.set(mint.name, (mintNameCounts.get(mint.name) ?? 0) + 1)
  }
  const nameCounts = new Map<string, number>()
  for (const ruler of rulingAuthorities) {
    nameCounts.set(ruler.name, (nameCounts.get(ruler.name) ?? 0) + 1)
  }
  const fields: FilterField<string>[] = [
    {
      id: "amount",
      label: "Amount",
      icon: <HashIcon />,
      disabled:
        !query.rules.some(
          (node) =>
            node.type === "rule" &&
            node.path[0] === "currency" &&
            node.operator === "is" &&
            currencySlugSchema.safeParse(node.value).success
        ) ||
        query.rules.some(
          (node) => node.type === "rule" && node.path[0] === "amount"
        ),
      type: "text",
      autoSelectOperator: true,
      operators: [{ value: "is", label: "is" }],
      placeholder: "0.5",
      validate: ({ value }) =>
        faceValueAmountQuerySchema.safeParse(value).success
          ? null
          : "Enter a positive decimal with up to 12 fractional digits.",
    },
    {
      id: "currency",
      label: "Currency",
      icon: <CoinsIcon />,
      pinSelected: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "currency"
      ),
      type: "select",
      autoSelectOperator: true,
      operators: [{ value: "is", label: "is" }],
      options: currencies.map((currency) => ({
        label: currency.fullName,
        value: currency.slug,
      })),
    },
    {
      id: "distribution",
      label: "Distribution",
      icon: <StackIcon />,
      pinSelected: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "distribution"
      ),
      type: "select",
      autoSelectOperator: true,
      operators: [{ value: "is", label: "is" }],
      options: [
        ...distributions.map(({ slug, name }) => ({
          label: name,
          value: slug,
        })),
        ...(distribution &&
        !distributions.some(({ slug }) => slug === distribution)
          ? [
              {
                label: `Unknown Distribution (${distribution})`,
                value: distribution,
                disabled: true,
              },
            ]
          : []),
      ],
    },
    {
      id: "engraver",
      label: "Engraver",
      icon: <PencilSimpleIcon />,
      pinSelected: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "engraver"
      ),
      type: "select",
      autoSelectOperator: true,
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
      id: "mint",
      label: "Mint",
      icon: <MapPinIcon />,
      pinSelected: true,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "mint"
      ),
      type: "select",
      autoSelectOperator: true,
      operators: [{ value: "is", label: "is" }],
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
    },
    {
      id: "year",
      label: "Year",
      icon: <CalendarBlankIcon />,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === "year"
      ),
      type: "text",
      autoSelectOperator: true,
      operators: [{ value: "is", label: "is" }],
      placeholder: "1986 or 25 BCE–19 CE",
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
    setQuery(
      queryFromFilters(
        amount,
        currencySlug,
        distribution,
        engraverSlug,
        issuerCode,
        mintSlug,
        rulingAuthoritySlug,
        year
      )
    )
  }, [
    amount,
    currencySlug,
    distribution,
    engraverSlug,
    issuerCode,
    mintSlug,
    rulingAuthoritySlug,
    year,
  ])

  return (
    <nav
      aria-label="Explore filters"
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
          const distributionRule = rule("distribution")
          const engraver = rule("engraver")
          const mint = rule("mint")
          const ruler = rule("ruler")
          const currency = rule("currency")
          const amountRule = rule("amount")
          const yearRule = rule("year")
          const nextAmount = faceValueAmountQuerySchema.safeParse(
            amountRule?.value
          )
          const nextCurrency = currencySlugSchema.safeParse(currency?.value)
          const nextDistribution = coinDistributionSchema.safeParse(
            distributionRule?.value
          )
          const nextEngraver = engraverSlugSchema.safeParse(engraver?.value)
          const nextIssuer = issuerCodeSchema.safeParse(issuer?.value)
          const nextMint = mintSlugSchema.safeParse(mint?.value)
          const nextRuler = rulingAuthoritySlugSchema.safeParse(ruler?.value)
          const nextYear = yearRule
            ? parseIssueYearFilterValue(yearRule.value ?? "")
            : undefined
          const patch: {
            amount?: string
            currency?: string
            distribution?: string
            engraver?: string
            issuer?: string
            mint?: string
            ruler?: string
            year?: CoinListYear
          } = {}
          if (
            !amountRule ||
            (amountRule.operator === "is" && nextAmount.success)
          ) {
            if (nextAmount.data !== amount) patch.amount = nextAmount.data
          }
          if (
            !currency ||
            (currency.operator === "is" && nextCurrency.success)
          ) {
            if (nextCurrency.data !== currencySlug)
              patch.currency = nextCurrency.data
          }
          if (
            !distributionRule ||
            (distributionRule.operator === "is" && nextDistribution.success)
          ) {
            if (nextDistribution.data !== distribution)
              patch.distribution = nextDistribution.data
          }
          if (
            !engraver ||
            (engraver.operator === "is" && nextEngraver.success)
          ) {
            if (nextEngraver.data !== engraverSlug)
              patch.engraver = nextEngraver.data
          }
          if (!issuer || (issuer.operator === "is" && nextIssuer.success)) {
            if (nextIssuer.data !== issuerCode) patch.issuer = nextIssuer.data
          }
          if (!mint || (mint.operator === "is" && nextMint.success)) {
            if (nextMint.data !== mintSlug) patch.mint = nextMint.data
          }
          if (!ruler || (ruler.operator === "is" && nextRuler.success)) {
            if (nextRuler.data !== rulingAuthoritySlug)
              patch.ruler = nextRuler.data
          }
          if (
            !yearRule ||
            (yearRule.operator === "is" && nextYear !== undefined)
          ) {
            if (nextYear !== year) patch.year = nextYear
          }
          if (Object.keys(patch).length) updateFilters(patch)
        }}
        showClear
      />
    </nav>
  )
}
