import { currencySlugSchema } from "@coin-archive/api"
import { CoinsIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const currencyFilterDefinition = {
  id: "currency",
  label: "Currency",
  icon: <CoinsIcon />,
  schema: currencySlugSchema,
  options: ({ currencies }) =>
    currencies.map(({ slug, fullName }) => ({
      label: fullName,
      value: slug,
    })),
} satisfies ExploreFilterDefinition
