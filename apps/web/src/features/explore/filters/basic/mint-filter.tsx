import { ExploreFilterCombobox } from "./explore-filter-combobox"
import type { MintResponse } from "@coin-archive/api"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

export function MintFilter({
  mintSlug,
  mints,
}: {
  mintSlug?: string
  mints: Array<MintResponse>
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const unknownMint =
    mintSlug && !mints.some(({ slug }) => slug === mintSlug)
      ? mintSlug
      : undefined
  const nameCounts = new Map<string, number>()
  for (const mint of mints) {
    nameCounts.set(mint.name, (nameCounts.get(mint.name) ?? 0) + 1)
  }
  const options = [
    ...mints.map(({ slug, name, place, country }) => ({
      label:
        nameCounts.get(name) === 1
          ? name
          : `${name} (${place}, ${country.name}; ${slug})`,
      value: slug,
    })),
    ...(unknownMint
      ? [
          {
            label: `Unknown Mint (${unknownMint})`,
            value: unknownMint,
            disabled: true,
          },
        ]
      : []),
  ]

  return (
    <ExploreFilterCombobox
      label="Mint"
      placeholder="All mints"
      emptyMessage="No mints found."
      options={options}
      name="mint"
      value={mintSlug ?? null}
      onValueChange={(selectedMint: string | null) => {
        const nextMint = selectedMint ?? undefined
        if (nextMint === mintSlug) return
        updateFilters({ mint: nextMint })
      }}
    />
  )
}
