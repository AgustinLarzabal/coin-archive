import { slugSchema } from "@coin-archive/api"
import { CircleIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const shapeFilterDefinition = {
  id: "shape",
  label: "Shape",
  icon: <CircleIcon />,
  schema: slugSchema,
  options: ({ shapes }) =>
    shapes.map(({ slug, name }) => ({ label: name, value: slug })),
} satisfies ExploreFilterDefinition
