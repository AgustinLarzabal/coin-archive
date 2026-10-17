import type { EngraverListItemResponse } from "@workspace/api"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"
import { ExploreFilterCombobox } from "@/features/explore/filters/explore-filter-combobox"

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
