import type { CatalogueOption, IssuerOption, RulerOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { createFilter, Filters } from "@workspace/ui/components/reui/filters"
import type {
  Filter,
  FilterFieldConfig,
} from "@workspace/ui/components/reui/filters"
import { Crown, FunnelX, Globe, ListFilter, BookImage } from "lucide-react"
import {
  getCatalogueOptionLabel,
  getRulerOptionLabel,
} from "../lib/coin-search"

type HomeFiltersProps = {
  catalogues: CatalogueOption[]
  issuers: IssuerOption[]
  rulers: RulerOption[]
  selectedCatalogueCode?: string
  selectedIssuerCode?: string
  selectedRulerCode?: string
  onFiltersChange: (filters: {
    catalogueCode: string | undefined
    issuerCode: string | undefined
    rulerCode: string | undefined
  }) => Promise<void>
}

export function HomeFilters({
  catalogues,
  issuers,
  rulers,
  selectedCatalogueCode,
  selectedIssuerCode,
  selectedRulerCode,
  onFiltersChange,
}: HomeFiltersProps) {
  const fields: FilterFieldConfig<string>[] = [
    {
      group: "Select",
      fields: [
        {
          key: "catalogue",
          label: "Catalogue",
          icon: <BookImage strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: catalogues.map((catalogue) => ({
            value: catalogue.code,
            label: getCatalogueOptionLabel(catalogue),
          })),
        },
        {
          key: "issuer",
          label: "Issuer",
          icon: <Globe strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[280px]",
          options: issuers.map((issuer) => ({
            value: issuer.code,
            label: issuer.name,
            icon: (
              <img
                src={`https://flagcdn.com/${issuer.isoCode.toLowerCase()}.svg`}
                alt={issuer.name}
                className="size-4 rounded-full object-cover"
              />
            ),
          })),
        },
        {
          key: "ruler",
          label: "Ruler",
          icon: <Crown strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[280px]",
          options: rulers.map((ruler) => ({
            value: ruler.code,
            label: getRulerOptionLabel(ruler),
          })),
        },
      ],
    },
  ]

  const filters: Filter<string>[] = [
    ...(selectedCatalogueCode
      ? [createFilter("catalogue", "is", [selectedCatalogueCode])]
      : []),
    ...(selectedIssuerCode
      ? [createFilter("issuer", "is", [selectedIssuerCode])]
      : []),
    ...(selectedRulerCode
      ? [createFilter("ruler", "is", [selectedRulerCode])]
      : []),
  ]

  async function handleFiltersChange(nextFilters: Filter<string>[]) {
    const catalogueFilter = nextFilters.find(
      (filter) => filter.field === "catalogue"
    )
    const catalogueCode = catalogueFilter?.values[0]
    const issuerFilter = nextFilters.find((filter) => filter.field === "issuer")
    const issuerCode = issuerFilter?.values[0]
    const rulerFilter = nextFilters.find((filter) => filter.field === "ruler")
    const rulerCode = rulerFilter?.values[0]

    await onFiltersChange({
      catalogueCode:
        typeof catalogueCode === "string" && catalogueCode.length > 0
          ? catalogueCode
          : undefined,
      issuerCode:
        typeof issuerCode === "string" && issuerCode.length > 0
          ? issuerCode
          : undefined,
      rulerCode:
        typeof rulerCode === "string" && rulerCode.length > 0
          ? rulerCode
          : undefined,
    })
  }

  async function clearFilters() {
    await onFiltersChange({
      catalogueCode: undefined,
      issuerCode: undefined,
      rulerCode: undefined,
    })
  }

  return (
    <div className="mb-5 flex gap-2.5">
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
  )
}
