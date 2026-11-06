import { CalendarBlankIcon } from "@phosphor-icons/react"
import type { ExploreFilterValue } from "../explore-filter-definitions"
import type { FilterField } from "@coin-archive/ui/components/reui/filters/filters-types"

export const yearFilterDefinition = {
  id: "year" as const,
  label: "Issue year",
  icon: <CalendarBlankIcon />,
  type: "number",
  operators: [
    { value: "eq", label: "equals" },
    { value: "between", label: "is between", arity: "range" },
  ],
} satisfies FilterField<ExploreFilterValue>
