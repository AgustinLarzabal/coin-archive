import { mintSlugSchema } from "@coin-archive/api"
import { MapPinIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const mintFilterDefinition = {
  id: "mint",
  label: "Mint",
  icon: <MapPinIcon />,
  schema: mintSlugSchema,
  options: ({ mints }, search) => {
    const nameCounts = new Map<string, number>()
    for (const mint of mints) {
      nameCounts.set(mint.name, (nameCounts.get(mint.name) ?? 0) + 1)
    }

    return [
      ...mints.map((mint) => ({
        label:
          nameCounts.get(mint.name) === 1
            ? mint.name
            : `${mint.name} (${mint.place}, ${mint.country.name}; ${mint.slug})`,
        value: mint.slug,
      })),
      ...(search.mint && !mints.some((mint) => mint.slug === search.mint)
        ? [
            {
              label: `Unknown Mint (${search.mint})`,
              value: search.mint,
              disabled: true,
            },
          ]
        : []),
    ]
  },
} satisfies ExploreFilterDefinition
