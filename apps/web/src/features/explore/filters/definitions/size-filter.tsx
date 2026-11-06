import { RulerIcon } from "@phosphor-icons/react"
import type { ExploreFilterValue } from "../explore-filter-definitions"
import type { FilterField } from "@coin-archive/ui/components/reui/filters/filters-types"

export const sizeFilterDefinition = {
  id: "size" as const,
  label: "Size (mm)",
  icon: <RulerIcon />,
  type: "number",
  operators: [
    { value: "eq", label: "equals" },
    { value: "between", label: "is between", arity: "range" },
  ],
} satisfies FilterField<ExploreFilterValue>
