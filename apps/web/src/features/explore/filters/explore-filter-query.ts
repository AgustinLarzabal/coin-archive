import {
  createFilterQuery,
  createFilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-query"
import { exploreFilterDefinitions } from "./explore-filter-definitions"

import type { ExploreSearch } from "../explore-search"
import type { ExploreFilterPatch } from "../explore-search-navigation"
import type { FilterQuery } from "@coin-archive/ui/components/reui/filters/filters-types"

export function searchToFilterQuery(
  search: ExploreSearch
): FilterQuery<string> {
  const rules = exploreFilterDefinitions.flatMap(({ id }) => {
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

  return createFilterQuery<string>(rules)
}

export function filterQueryToPatch(
  query: FilterQuery<string>,
  search: ExploreSearch
): ExploreFilterPatch | null {
  const selected: Record<string, string | undefined> = {}
  for (const { id } of exploreFilterDefinitions) selected[id] = undefined
  let hasIncompleteRule = false

  for (const rule of query.rules) {
    if (rule.type !== "rule") return null
    const definition = exploreFilterDefinitions.find(
      ({ id }) => id === rule.path[0]
    )
    if (!definition) return null
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
  return exploreFilterDefinitions.every(({ id }) => selected[id] === search[id])
    ? {}
    : selected
}
