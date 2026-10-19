import { ExploreFilterCombobox } from "./explore-filter-combobox"
import type { RulingAuthorityListItemResponse } from "@coin-archive/api"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

type RulingAuthorityOption = {
  disabled?: boolean
  label: string
  value: string
}

export function RulingAuthorityFilter({
  rulingAuthoritySlug,
  rulingAuthorities,
}: {
  rulingAuthoritySlug?: string
  rulingAuthorities: Array<RulingAuthorityListItemResponse>
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const missingRulingAuthoritySlug =
    rulingAuthoritySlug &&
    !rulingAuthorities.some(
      (rulingAuthority) => rulingAuthority.slug === rulingAuthoritySlug
    )
      ? rulingAuthoritySlug
      : undefined
  const nameCounts = new Map<string, number>()
  for (const rulingAuthority of rulingAuthorities) {
    nameCounts.set(
      rulingAuthority.name,
      (nameCounts.get(rulingAuthority.name) ?? 0) + 1
    )
  }
  const options: Array<RulingAuthorityOption> = [
    ...rulingAuthorities.map((rulingAuthority) => ({
      label:
        nameCounts.get(rulingAuthority.name) === 1
          ? rulingAuthority.name
          : `${rulingAuthority.name} (${rulingAuthority.slug})`,
      value: rulingAuthority.slug,
    })),
    ...(missingRulingAuthoritySlug
      ? [
          {
            disabled: true,
            label: `Ruler / Period not found (${missingRulingAuthoritySlug})`,
            value: missingRulingAuthoritySlug,
          },
        ]
      : []),
  ]
  return (
    <ExploreFilterCombobox
      label="Ruler / Period"
      placeholder="All rulers / periods"
      emptyMessage="No rulers / periods found."
      options={options}
      name="ruler"
      value={rulingAuthoritySlug ?? null}
      onValueChange={(rulingAuthority: string | null) => {
        const nextRulingAuthoritySlug = rulingAuthority || undefined
        if (nextRulingAuthoritySlug === rulingAuthoritySlug) return
        updateFilters({ ruler: nextRulingAuthoritySlug })
      }}
    />
  )
}
