import { compositionSlugSchema } from "@coin-archive/api"
import { CirclesThreeIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const compositionFilterDefinition = {
  id: "composition",
  label: "Composition",
  icon: <CirclesThreeIcon />,
  schema: compositionSlugSchema,
  options: ({ compositions }) =>
    compositions.map(({ slug, name }) => ({ label: name, value: slug })),
} satisfies ExploreFilterDefinition
