import { Filters } from "@coin-archive/ui/components/reui/filters/filters"
import { useEffect, useState } from "react"
import { getExploreFilterFields } from "./explore-filter-definitions"
import { filterQueryToPatch, searchToFilterQuery } from "./explore-filter-query"
import type {
  ExploreFilterLists,
  ExploreFilterValue,
} from "./explore-filter-definitions"
import type { ExploreSearch } from "@/features/explore/explore-search"
import type { FilterQuery } from "@coin-archive/ui/components/reui/filters/filters-types"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

export function ExploreFilters({
  search,
  ...lists
}: ExploreFilterLists & { search: ExploreSearch }) {
  const {
    currency: currencySlug,
    distribution,
    engraver: engraverSlug,
    issuer: issuerCode,
    mint: mintSlug,
    ruler: rulingAuthoritySlug,
    size,
    year,
  } = search
  const { updateFilters } = useExploreSearchNavigation()
  const [query, setQuery] = useState(() => searchToFilterQuery(search))

  useEffect(
    () => setQuery(searchToFilterQuery(search)),
    [
      currencySlug,
      distribution,
      engraverSlug,
      issuerCode,
      mintSlug,
      rulingAuthoritySlug,
      size,
      year,
    ]
  )

  const fields = getExploreFilterFields(lists, search, query)

  return (
    <Filters
      fields={fields}
      query={query}
      onQueryChange={(next: FilterQuery<ExploreFilterValue>) => {
        const patch = filterQueryToPatch(next, search)
        if (patch === null) return
        setQuery(next)
        if (Object.keys(patch).length > 0) updateFilters(patch)
      }}
      onBeforeQueryChange={(next) => {
        if (next.rules.length > fields.length || next.combinator !== "and")
          return false
        if (filterQueryToPatch(next, search) === null) return false
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
