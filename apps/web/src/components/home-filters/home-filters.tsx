import type {
  DistributionOption,
  EngraverOption,
  IssuerOption,
} from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { Filters } from "@workspace/ui/components/reui/filters"
import type { Filter } from "@workspace/ui/components/reui/filters"
import { FunnelX, ListFilter } from "lucide-react"
import {
  getHomeFilterFields,
  getHomeFilters,
  getHomeFilterValues,
} from "./home-filters.helpers"

type HomeFiltersProps = {
  distributions: DistributionOption[]
  engravers: EngraverOption[]
  issuers: IssuerOption[]
  selectedDistributionCode?: string
  selectedEngraverCode?: string
  selectedIssuerCode?: string
  onFiltersChange: (filters: {
    distributionCode: string | undefined
    engraverCode: string | undefined
    issuerCode: string | undefined
  }) => Promise<void>
}

export function HomeFilters({
  distributions,
  engravers,
  issuers,
  selectedDistributionCode,
  selectedEngraverCode,
  selectedIssuerCode,
  onFiltersChange,
}: HomeFiltersProps) {
  const filters = getHomeFilters({
    selectedDistributionCode,
    selectedEngraverCode,
    selectedIssuerCode,
  })

  const fields = getHomeFilterFields({
    distributions,
    engravers,
    issuers,
  })

  async function handleFiltersChange(newFilters: Filter[]) {
    await onFiltersChange(getHomeFilterValues(newFilters))
  }

  async function clearFilters() {
    await onFiltersChange({
      distributionCode: undefined,
      engraverCode: undefined,
      issuerCode: undefined,
    })
  }

  return (
    <div className="mb-10">
      <div className="flex gap-2.5">
        <div className="flex-1">
          <Filters
            filters={filters}
            fields={fields}
            onChange={handleFiltersChange}
            trigger={
              <Button variant="outline">
                <ListFilter strokeWidth={2} />
                Add Filter
              </Button>
            }
          />
        </div>

        {filters.length > 0 ? (
          <Button variant="outline" onClick={clearFilters}>
            <FunnelX strokeWidth={2} />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  )
}
