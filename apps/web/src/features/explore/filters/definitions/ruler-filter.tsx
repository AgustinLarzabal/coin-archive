import { rulingAuthoritySlugSchema } from "@coin-archive/api"
import { CrownIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const rulerFilterDefinition = {
  id: "ruler",
  label: "Ruler / Period",
  icon: <CrownIcon />,
  schema: rulingAuthoritySlugSchema,
  options: ({ rulingAuthorities }) => {
    const nameCounts = new Map<string, number>()
    for (const ruler of rulingAuthorities) {
      nameCounts.set(ruler.name, (nameCounts.get(ruler.name) ?? 0) + 1)
    }

    return rulingAuthorities.map(({ slug, name }) => ({
      label: nameCounts.get(name) === 1 ? name : `${name} (${slug})`,
      value: slug,
    }))
  },
} satisfies ExploreFilterDefinition
