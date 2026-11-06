import { sizeFilterDefinition } from "./size-filter"
import type { ExploreFilterValue } from "../explore-filter-definitions"
import type { FilterField } from "@coin-archive/ui/components/reui/filters/filters-types"

export const weightFilterDefinition = {
  ...sizeFilterDefinition,
  id: "weight" as const,
  label: "Weight (g)",
} satisfies FilterField<ExploreFilterValue>
