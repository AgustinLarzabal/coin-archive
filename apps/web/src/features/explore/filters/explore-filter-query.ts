import {
  coinListSizeSchema,
  coinListSizeToInterval,
  coinListWeightSchema,
  coinListWeightToInterval,
  coinListYearSchema,
  coinListYearToInterval,
  faceValueAmountQuerySchema,
} from "@coin-archive/api"
import {
  createFilterQuery,
  createFilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-query"
import { exploreFilterDefinitions } from "./explore-filter-definitions"

import type { ExploreSearch } from "../explore-search"
import type { ExploreFilterValue } from "./explore-filter-definitions"
import type { ExploreFilterPatch } from "../explore-search-navigation"
import type {
  CoinListSize,
  CoinListThickness,
  CoinListWeight,
  CoinListYear,
} from "@coin-archive/api"
import type {
  FilterQuery,
  FilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-types"

// undefined means unfinished input; null means an invalid rule.
function parseYearRule(
  rule: FilterRule<ExploreFilterValue>
): CoinListYear | undefined | null {
  if (rule.operator === "" && rule.value === undefined) return undefined
  if (rule.operator !== "eq" && rule.operator !== "between") return null
  if (
    rule.value === undefined ||
    (Array.isArray(rule.value) &&
      rule.value.some((value) => value === undefined))
  )
    return undefined
  if (rule.operator === "between" && !Array.isArray(rule.value)) return null
  if (rule.operator === "eq" && typeof rule.value !== "number") return null

  const value = Array.isArray(rule.value)
    ? `${rule.value[0]}-${rule.value[1]}`
    : rule.value
  const parsed = coinListYearSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

function parseMeasurementRule(
  rule: FilterRule<ExploreFilterValue>,
  field: "size" | "thickness" | "weight"
): string | undefined | null {
  if (rule.operator === "" && rule.value === undefined) return undefined
  if (rule.operator !== "eq" && rule.operator !== "between") return null
  if (
    rule.value === undefined ||
    (Array.isArray(rule.value) &&
      rule.value.some((value) => value === undefined))
  )
    return undefined
  if (rule.operator === "between" && !Array.isArray(rule.value)) return null
  if (rule.operator !== "between" && typeof rule.value !== "number") return null

  const value = Array.isArray(rule.value)
    ? `${rule.value[0]}-${rule.value[1]}`
    : String(rule.value)
  const parsed = (
    field === "weight" ? coinListWeightSchema : coinListSizeSchema
  ).safeParse(value)
  return parsed.success ? parsed.data : null
}

export function searchToFilterQuery(
  search: ExploreSearch
): FilterQuery<ExploreFilterValue> {
  const rules: ReturnType<typeof createFilterRule<ExploreFilterValue>>[] =
    exploreFilterDefinitions.flatMap(({ id }) => {
      if (
        id === "year" ||
        id === "size" ||
        id === "thickness" ||
        id === "weight"
      )
        return []
      if (id === "amount" && search.currency === undefined) return []
      const value = search[id]
      if (value === undefined) return []

      return [
        createFilterRule({
          id: `explore-${id}`,
          path: [id],
          operator: id === "amount" ? "eq" : "is",
          value,
        }),
      ]
    })

  if (search.year !== undefined) {
    const { firstIssueYear, lastIssueYear } = coinListYearToInterval(
      search.year
    )
    rules.push(
      createFilterRule({
        id: "explore-year",
        path: ["year"],
        operator: typeof search.year === "number" ? "eq" : "between",
        value:
          typeof search.year === "number"
            ? search.year
            : ([firstIssueYear, lastIssueYear] as [number, number]),
      })
    )
  }

  for (const field of ["size", "thickness", "weight"] as const) {
    const measurement = search[field]
    if (measurement === undefined) continue
    const { min, max } =
      field === "weight"
        ? coinListWeightToInterval(measurement)
        : coinListSizeToInterval(measurement)
    // shortcut: the numeric editor rounds very long decimals, use a string editor if catalogue measurements need full 18-digit precision.
    rules.push(
      createFilterRule({
        id: `explore-${field}`,
        path: [field],
        operator: measurement.includes("-") ? "between" : "eq",
        value: measurement.includes("-")
          ? [Number(min), Number(max)]
          : Number(min),
      })
    )
  }

  return createFilterQuery<ExploreFilterValue>(rules)
}

export function filterQueryToPatch(
  query: FilterQuery<ExploreFilterValue>,
  search: ExploreSearch
): ExploreFilterPatch | null {
  const selected: Record<string, string | undefined> = {}
  for (const { id } of exploreFilterDefinitions) {
    if (id !== "year" && id !== "size" && id !== "thickness" && id !== "weight")
      selected[id] = undefined
  }
  let year: CoinListYear | undefined
  let size: CoinListSize | undefined
  let thickness: CoinListThickness | undefined
  let weight: CoinListWeight | undefined
  let hasIncompleteRule = false

  for (const rule of query.rules) {
    if (rule.type !== "rule") return null
    if (rule.path[0] === "amount") {
      if (rule.operator === "" && rule.value === undefined) {
        hasIncompleteRule = true
        continue
      }
      if (rule.operator !== "eq") return null
      if (rule.value === undefined) {
        hasIncompleteRule = true
        continue
      }
      const parsed = faceValueAmountQuerySchema.safeParse(rule.value)
      if (!parsed.success) return null
      selected.amount = parsed.data
      continue
    }
    if (rule.path[0] === "year") {
      const parsed = parseYearRule(rule)
      if (parsed === null) return null
      if (parsed === undefined) hasIncompleteRule = true
      else year = parsed
      continue
    }
    if (
      rule.path[0] === "size" ||
      rule.path[0] === "thickness" ||
      rule.path[0] === "weight"
    ) {
      const parsed = parseMeasurementRule(rule, rule.path[0])
      if (parsed === null) return null
      if (parsed === undefined) hasIncompleteRule = true
      else if (rule.path[0] === "size") size = parsed
      else if (rule.path[0] === "thickness") thickness = parsed
      else weight = parsed
      continue
    }
    const definition = exploreFilterDefinitions.find(
      ({ id }) => id === rule.path[0]
    )
    if (!definition || !("schema" in definition)) return null
    if (rule.operator !== "is") return null
    if (rule.value === undefined) {
      hasIncompleteRule = true
      continue
    }
    const parsed = definition.schema.safeParse(rule.value)
    if (!parsed.success) return null
    selected[definition.id] = parsed.data
  }

  // The filter picker creates a rule before its value is chosen.
  if (hasIncompleteRule) return {}
  if (selected.currency === undefined) selected.amount = undefined
  return exploreFilterDefinitions.every(
    ({ id }) =>
      id === "year" ||
      id === "size" ||
      id === "thickness" ||
      id === "weight" ||
      selected[id] === search[id]
  ) &&
    year === search.year &&
    size === search.size &&
    thickness === search.thickness &&
    weight === search.weight
    ? {}
    : { ...selected, year, size, thickness, weight }
}
