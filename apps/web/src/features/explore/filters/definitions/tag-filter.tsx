import { slugSchema } from "@coin-archive/api"
import { TagIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const tagFilterDefinition = {
  id: "tag",
  label: "Tag",
  icon: <TagIcon />,
  schema: slugSchema,
  options: ({ tags }) =>
    tags.map(({ slug, name }) => ({ label: name, value: slug })),
} satisfies ExploreFilterDefinition
