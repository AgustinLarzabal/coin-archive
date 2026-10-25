import {
  coinDistributionSchema,
  currencySlugSchema,
  engraverSlugSchema,
  faceValueAmountQuerySchema,
  isIsoIssuerCode,
  issuerCodeSchema,
  measurementMinExceedsMax,
  measurementQuerySchema,
  mintSlugSchema,
  rulingAuthoritySlugSchema,
} from "@coin-archive/api"
import { Button } from "@coin-archive/ui/components/button"
import { Flag } from "@coin-archive/ui/components/flags/flag"
import { Input } from "@coin-archive/ui/components/input"
import { Filters } from "@coin-archive/ui/components/reui/filters/filters"
import { FilterTextEditor } from "@coin-archive/ui/components/reui/filters/filters-editors"
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
import { useLocation } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import type { ExploreSearch } from "@/features/explore/explore-search"
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
  FilterEditorProps,
  FilterField,
  FilterNode,
  FilterQuery,
  FilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-types"
import type { KeyboardEvent } from "react"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"
import {
  formatIssueYearFilterValue,
  parseIssueYearFilterValue,
} from "@/features/explore/filters/issue-year-filter-value"

type FilterValue = string | [string | undefined, string | undefined]

// Keep bounds as strings; the shared range editor converts them through Number.
function MeasurementEditor(props: FilterEditorProps<FilterValue>) {
  if (props.operator.arity !== "range") return <FilterTextEditor {...props} />

  const {
    value,
    onValueChange,
    autoFocusProps,
    labels,
    host,
    field,
    commit,
    cancel,
  } = props
  const bounds = Array.isArray(value) ? value : ["", ""]
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault()
      commit()
    } else if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      cancel()
    }
  }
  return (
    <div
      data-slot="filter-editor"
      className="flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2 p-2"
    >
      <div className="flex items-center gap-1.5">
        <Input
          {...autoFocusProps}
          inputMode="decimal"
          value={bounds[0] ?? ""}
          aria-label={labels.rangeFrom(field.label)}
          onChange={(event) =>
            onValueChange([event.target.value, bounds[1] ?? ""])
          }
          onKeyDown={onKeyDown}
        />
        <span className="text-xs text-muted-foreground">
          {labels.rangeSeparator}
        </span>
        <Input
          inputMode="decimal"
          value={bounds[1] ?? ""}
          aria-label={labels.rangeTo(field.label)}
          onChange={(event) =>
            onValueChange([bounds[0] ?? "", event.target.value])
          }
          onKeyDown={onKeyDown}
        />
      </div>
      {host === "amend" && (
        <div className="flex justify-end gap-1.5">
          <Button type="button" variant="ghost" size="sm" onClick={cancel}>
            {labels.discard}
          </Button>
          <Button type="button" size="sm" onClick={() => commit()}>
            {labels.apply}
          </Button>
        </div>
      )}
    </div>
  )
}

function filterField(node: FilterNode<FilterValue>) {
  return node.type === "rule" ? node.path[0] : ""
}

const measurementFields = [
  { id: "size", label: "Size (mm)", precision: 2, placeholder: "25.75" },
  {
    id: "thickness",
    label: "Thickness (mm)",
    precision: 2,
    placeholder: "2.25",
  },
  { id: "weight", label: "Weight (g)", precision: 3, placeholder: "8.125" },
] as const
type MeasurementName = (typeof measurementFields)[number]["id"]
type MeasurementKey = `${MeasurementName}${"Min" | "Max"}`

function queryFromFilters(
  amount: string | undefined,
  currencySlug: string | undefined,
  distribution: string | undefined,
  engraverSlug: string | undefined,
  issuerCode: string | undefined,
  mintSlug: string | undefined,
  rulingAuthoritySlug: string | undefined,
  year: CoinListYear | undefined,
  measurements: Pick<ExploreSearch, MeasurementKey>,
  order?: string[]
): FilterQuery<FilterValue> {
  const query = createFilterQuery<FilterValue>([
    ...measurementFields.flatMap(({ id }) => {
      const min = measurements[`${id}Min`]
      const max = measurements[`${id}Max`]
      return min === undefined && max === undefined
        ? []
        : [
            createFilterRule<FilterValue>({
              id: `explore-${id}`,
              path: [id],
              operator:
                min === undefined
                  ? "lte"
                  : max === undefined
                    ? "gte"
                    : min === max
                      ? "eq"
                      : "between",
              value:
                min === undefined
                  ? max
                  : max === undefined || min === max
                    ? min
                    : [min, max],
            }),
          ]
    }),
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
  if (order) {
    query.rules.sort((a, b) => {
      const first = order.indexOf(filterField(a))
      const second = order.indexOf(filterField(b))
      return (
        (first < 0 ? order.length : first) -
        (second < 0 ? order.length : second)
      )
    })
  }
  return query
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
  sizeMin,
  sizeMax,
  thicknessMin,
  thicknessMax,
  weightMin,
  weightMax,
}: {
  sizeMin?: string
  sizeMax?: string
  thicknessMin?: string
  thicknessMax?: string
  weightMin?: string
  weightMax?: string
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
  const filterOrder = useLocation({
    select: (location) =>
      Array.isArray(location.state.exploreFilterOrder)
        ? location.state.exploreFilterOrder
        : undefined,
  })
  const [query, setQuery] = useState(() =>
    queryFromFilters(
      amount,
      currencySlug,
      distribution,
      engraverSlug,
      issuerCode,
      mintSlug,
      rulingAuthoritySlug,
      year,
      { sizeMin, sizeMax, thicknessMin, thicknessMax, weightMin, weightMax }
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
  const fields: FilterField<FilterValue>[] = [
    ...measurementFields.map(({ id, label, precision, placeholder }) => ({
      id,
      label,
      icon: <HashIcon />,
      disabled: query.rules.some(
        (node) => node.type === "rule" && node.path[0] === id
      ),
      type: "number" as const,
      editor: MeasurementEditor,
      operators: [
        { value: "eq", label: "equals" },
        { value: "between", label: "is between", arity: "range" as const },
        { value: "gte", label: "is at least", hidden: true },
        { value: "lte", label: "is at most", hidden: true },
      ],
      placeholder,
      validate: ({ values }: { values: unknown[] }) =>
        values.every(
          (value) => measurementQuerySchema(precision).safeParse(value).success
        )
          ? null
          : `Enter a positive decimal with up to ${precision} decimal places.`,
    })),
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
        year,
        { sizeMin, sizeMax, thicknessMin, thicknessMax, weightMin, weightMax },
        filterOrder
      )
    )
  }, [
    amount,
    currencySlug,
    distribution,
    engraverSlug,
    filterOrder,
    issuerCode,
    mintSlug,
    rulingAuthoritySlug,
    year,
    sizeMin,
    sizeMax,
    thicknessMin,
    thicknessMax,
    weightMin,
    weightMax,
  ])

  return (
    <nav
      aria-label="Explore filters"
      className="flex flex-wrap items-start gap-3 border-b px-5 py-4 md:items-center md:gap-5 md:px-10"
    >
      <Filters
        fields={fields}
        query={query}
        onQueryChange={(
          next,
          details = { reason: "update", rule: null, field: null }
        ) => {
          const measurementRule = (name: MeasurementName) =>
            next.rules.find(
              (node): node is FilterRule<FilterValue> =>
                node.type === "rule" &&
                node.path[0] === name &&
                node.id === details.rule?.id
            ) ??
            [...next.rules]
              .reverse()
              .find(
                (node): node is FilterRule<FilterValue> =>
                  node.type === "rule" && node.path[0] === name
              )
          const rules = next.rules.filter(
            (node) =>
              node.type !== "rule" ||
              !measurementFields.some(({ id }) => id === node.path[0]) ||
              node.id === measurementRule(node.path[0] as MeasurementName)?.id
          )
          const rule = (field: string) =>
            rules.find(
              (node): node is FilterRule<FilterValue> =>
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
            ? parseIssueYearFilterValue(
                typeof yearRule.value === "string" ? yearRule.value : ""
              )
            : undefined
          const patch: {
            sizeMin?: string
            sizeMax?: string
            thicknessMin?: string
            thicknessMax?: string
            weightMin?: string
            weightMax?: string
            amount?: string
            currency?: string
            distribution?: string
            engraver?: string
            issuer?: string
            mint?: string
            ruler?: string
            year?: CoinListYear
          } = {}
          const currentMeasurements = {
            sizeMin,
            sizeMax,
            thicknessMin,
            thicknessMax,
            weightMin,
            weightMax,
          }
          for (const { id, precision } of measurementFields) {
            const selected = measurementRule(id)
            const minKey = `${id}Min` as MeasurementKey
            const maxKey = `${id}Max` as MeasurementKey
            const values =
              selected?.operator === "between" && Array.isArray(selected.value)
                ? selected.value
                : [selected?.value]
            const parsedMin = measurementQuerySchema(precision).safeParse(
              values[0]
            )
            const parsedMax = measurementQuerySchema(precision).safeParse(
              values[1]
            )
            const completeRange =
              values[0] !== undefined &&
              values[0] !== "" &&
              values[1] !== undefined &&
              values[1] !== ""
            if (
              selected?.value !== undefined &&
              (selected.operator === "between"
                ? completeRange &&
                  (!parsedMin.success ||
                    !parsedMax.success ||
                    measurementMinExceedsMax(parsedMin.data, parsedMax.data))
                : !parsedMin.success)
            ) {
              return
            }
            let min = currentMeasurements[minKey]
            let max = currentMeasurements[maxKey]
            if (!selected) {
              min = undefined
              max = undefined
            } else if (
              (selected.operator === "eq" || selected.operator === "gte") &&
              parsedMin.success
            ) {
              min = parsedMin.data
              max = selected.operator === "eq" ? parsedMin.data : undefined
            } else if (selected.operator === "lte" && parsedMin.success) {
              min = undefined
              max = parsedMin.data
            } else if (
              selected.operator === "between" &&
              parsedMin.success &&
              parsedMax.success
            ) {
              min = parsedMin.data
              max = parsedMax.data
            }
            if (
              min !== undefined &&
              max !== undefined &&
              measurementMinExceedsMax(min, max)
            ) {
              return
            }
            if (min !== currentMeasurements[minKey]) patch[minKey] = min
            if (max !== currentMeasurements[maxKey]) patch[maxKey] = max
          }
          setQuery({ ...next, rules })
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
          if (Object.keys(patch).length) {
            updateFilters(patch, rules.map(filterField))
          }
        }}
        showClear
      />
    </nav>
  )
}
