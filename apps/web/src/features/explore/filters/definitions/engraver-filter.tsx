import { engraverSlugSchema } from "@coin-archive/api"
import { PencilSimpleIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const engraverFilterDefinition = {
  id: "engraver",
  label: "Engraver",
  icon: <PencilSimpleIcon />,
  schema: engraverSlugSchema,
  options: ({ engravers }, search) => [
    ...engravers.map(({ fullName, slug }) => ({
      label: fullName,
      value: slug,
    })),
    ...(search.engraver &&
    !engravers.some(({ slug }) => slug === search.engraver)
      ? [
          {
            label: `Unknown engraver (${search.engraver})`,
            value: search.engraver,
            disabled: true,
          },
        ]
      : []),
  ],
} satisfies ExploreFilterDefinition
