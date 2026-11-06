import { sizeFilterDefinition } from "./size-filter"
import type { ExploreFilterValue } from "../explore-filter-definitions"
import type { FilterField } from "@coin-archive/ui/components/reui/filters/filters-types"

export const thicknessFilterDefinition = {
  ...sizeFilterDefinition,
  id: "thickness" as const,
  label: "Thickness (mm)",
} satisfies FilterField<ExploreFilterValue>
