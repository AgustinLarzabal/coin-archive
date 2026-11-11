import { slugSchema } from "@coin-archive/api"
import { CoinsIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const currencyFilterDefinition = {
  id: "currency",
  label: "Currency",
  icon: <CoinsIcon />,
  schema: slugSchema,
  options: ({ currencies }) =>
    currencies.map(({ slug, fullName }) => ({
      label: fullName,
      value: slug,
    })),
} satisfies ExploreFilterDefinition
