import { CoinsIcon } from "@phosphor-icons/react"
import type { ExploreFilterValue } from "../explore-filter-definitions"
import type { FilterField } from "@coin-archive/ui/components/reui/filters/filters-types"

export const amountFilterDefinition = {
  id: "amount" as const,
  label: "Face Value Amount",
  icon: <CoinsIcon />,
  type: "text",
  placeholder: "e.g. 0.5",
  operators: [{ value: "eq", label: "equals" }],
  defaultOperator: "eq",
  autoSelectOperator: true,
} satisfies FilterField<ExploreFilterValue>
