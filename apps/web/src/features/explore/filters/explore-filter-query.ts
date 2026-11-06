import { coinListYearSchema, coinListYearToInterval } from "@coin-archive/api"
import {
  createFilterQuery,
  createFilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-query"
import { exploreFilterDefinitions } from "./explore-filter-definitions"

import type { ExploreSearch } from "../explore-search"
import type { ExploreFilterValue } from "./explore-filter-definitions"
import type { ExploreFilterPatch } from "../explore-search-navigation"
import type { CoinListYear } from "@coin-archive/api"
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

export function searchToFilterQuery(
  search: ExploreSearch
): FilterQuery<ExploreFilterValue> {
  const rules: ReturnType<typeof createFilterRule<ExploreFilterValue>>[] =
    exploreFilterDefinitions.flatMap(({ id }) => {
      if (id === "year") return []
      const value = search[id]
      if (value === undefined) return []

      return [
        createFilterRule({
          id: `explore-${id}`,
          path: [id],
          operator: "is",
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

  return createFilterQuery<ExploreFilterValue>(rules)
}

export function filterQueryToPatch(
  query: FilterQuery<ExploreFilterValue>,
  search: ExploreSearch
): ExploreFilterPatch | null {
  const selected: Record<string, string | undefined> = {}
  for (const { id } of exploreFilterDefinitions) {
    if (id !== "year") selected[id] = undefined
  }
  let year: CoinListYear | undefined
  let hasIncompleteRule = false

  for (const rule of query.rules) {
    if (rule.type !== "rule") return null
    if (rule.path[0] === "year") {
      const parsed = parseYearRule(rule)
      if (parsed === null) return null
      if (parsed === undefined) hasIncompleteRule = true
      else year = parsed
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
  return exploreFilterDefinitions.every(
    ({ id }) => id === "year" || selected[id] === search[id]
  ) && year === search.year
    ? {}
    : { ...selected, year }
}
