import type {
  DistributionOption,
  EngraverOption,
  IssuerOption,
  RulerOption,
  ThemeOption,
} from "@coin-archive/db"
import { Button } from "@coin-archive/ui/components/button"
import { Filters } from "@coin-archive/ui/components/reui/filters"
import type { Filter } from "@coin-archive/ui/components/reui/filters"
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
  rulers: RulerOption[]
  themes: ThemeOption[]
  selectedDistributionCode?: string
  selectedEngraverCode?: string
  selectedIssuerCode?: string
  selectedRulerCode?: string
  selectedThemeCode?: string
  onFiltersChange: (filters: {
    distributionCode: string | undefined
    engraverCode: string | undefined
    issuerCode: string | undefined
    rulerCode: string | undefined
    themeCode: string | undefined
  }) => Promise<void>
}

export function HomeFilters({
  distributions,
  engravers,
  issuers,
  rulers,
  themes,
  selectedDistributionCode,
  selectedEngraverCode,
  selectedIssuerCode,
  selectedRulerCode,
  selectedThemeCode,
  onFiltersChange,
}: HomeFiltersProps) {
  const filters = getHomeFilters({
    selectedDistributionCode,
    selectedEngraverCode,
    selectedIssuerCode,
    selectedRulerCode,
    selectedThemeCode,
  })

  const fields = getHomeFilterFields({
    distributions,
    engravers,
    issuers,
    rulers,
    themes,
  })

  async function handleFiltersChange(newFilters: Filter[]) {
    await onFiltersChange(getHomeFilterValues(newFilters))
  }

  async function clearFilters() {
    await onFiltersChange({
      distributionCode: undefined,
      engraverCode: undefined,
      issuerCode: undefined,
      rulerCode: undefined,
      themeCode: undefined,
    })
  }

  return (
    <div className="">
      <div className="flex gap-2.5">
        <div className="flex-1">
          <Filters
            filters={filters}
            fields={fields}
            allowMultiple={false}
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
