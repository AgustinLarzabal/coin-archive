import { techniqueSlugSchema } from "@coin-archive/api"
import { GearIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const techniqueFilterDefinition = {
  id: "technique",
  label: "Technique",
  icon: <GearIcon />,
  schema: techniqueSlugSchema,
  options: ({ techniques }) =>
    techniques.map(({ slug, name }) => ({ label: name, value: slug })),
} satisfies ExploreFilterDefinition
