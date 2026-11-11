import { slugSchema } from "@coin-archive/api"
import { ArrowsClockwiseIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const orientationFilterDefinition = {
  id: "orientation",
  label: "Orientation",
  icon: <ArrowsClockwiseIcon />,
  schema: slugSchema,
  options: ({ orientations }) =>
    orientations.map(({ slug, name }) => ({ label: name, value: slug })),
} satisfies ExploreFilterDefinition
