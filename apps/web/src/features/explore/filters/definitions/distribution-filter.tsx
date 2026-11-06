import { coinDistributionSchema } from "@coin-archive/api"
import { StackIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const distributionFilterDefinition = {
  id: "distribution",
  label: "Distribution",
  icon: <StackIcon />,
  schema: coinDistributionSchema,
  options: ({ distributions }) =>
    distributions.map(({ slug, name }) => ({ label: name, value: slug })),
} satisfies ExploreFilterDefinition
