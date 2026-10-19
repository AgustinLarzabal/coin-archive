import { ExploreFilterCombobox } from "./explore-filter-combobox"
import type { EngraverListItemResponse } from "@coin-archive/api"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

type EngraverFilterProps = {
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
}

type EngraverOption = {
  disabled?: boolean
  label: string
  value: string
}

export function EngraverFilter({
  engraverSlug,
  engravers,
}: EngraverFilterProps) {
  const { updateFilters } = useExploreSearchNavigation()
  const unknownEngraverSlug =
    engraverSlug &&
    !engravers.some((engraver) => engraver.slug === engraverSlug)
      ? engraverSlug
      : undefined
  const options: Array<EngraverOption> = [
    ...engravers.map((engraver) => ({
      label: engraver.fullName,
      value: engraver.slug,
    })),
    ...(unknownEngraverSlug
      ? [
          {
            disabled: true,
            label: `Unknown engraver (${unknownEngraverSlug})`,
            value: unknownEngraverSlug,
          },
        ]
      : []),
  ]
  return (
    <ExploreFilterCombobox
      label="Engraver"
      placeholder="All engravers"
      emptyMessage="No engravers found."
      options={options}
      value={engraverSlug ?? null}
      onValueChange={(engraver: string | null) => {
        const nextEngraverSlug = engraver || undefined

        if (nextEngraverSlug === engraverSlug) return

        updateFilters({ engraver: nextEngraverSlug })
      }}
    />
  )
}
