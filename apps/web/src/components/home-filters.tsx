import type {
  CatalogueOption,
  CompositionOption,
  CurrencyOption,
  DemonetizationFilterValue,
  EdgeOption,
  IssuerOption,
  OrientationOption,
  RimOption,
  RulerOption,
} from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { createFilter, Filters } from "@workspace/ui/components/reui/filters"
import type {
  Filter,
  FilterFieldConfig,
} from "@workspace/ui/components/reui/filters"
import {
  Crown,
  FunnelX,
  Globe,
  ListFilter,
  BookImage,
  Box,
  DollarSign,
  CircleDashed,
  CircleArrowDown,
  BanknoteX,
  Circle,
} from "lucide-react"
import {
  demonetizationFilterOptions,
  getCatalogueOptionLabel,
  getCompositionOptionLabel,
  getCurrencyOptionLabel,
  getEdgeOptionLabel,
  getOrientationOptionLabel,
  getRimOptionLabel,
  getRulerOptionLabel,
} from "../lib/coin-search"

type HomeFiltersProps = {
  catalogues: CatalogueOption[]
  compositions: CompositionOption[]
  currencies: CurrencyOption[]
  edges: EdgeOption[]
  issuers: IssuerOption[]
  orientations: OrientationOption[]
  rims: RimOption[]
  rulers: RulerOption[]
  selectedCatalogueCode?: string
  selectedCompositionCode?: string
  selectedCurrencyCode?: string
  selectedEdgeCode?: string
  selectedDemonetization?: DemonetizationFilterValue
  selectedIssuerCode?: string
  selectedOrientationCode?: string
  selectedRimCode?: string
  selectedRulerCode?: string
  onFiltersChange: (filters: {
    catalogueCode: string | undefined
    compositionCode: string | undefined
    currencyCode: string | undefined
    demonetization: DemonetizationFilterValue | undefined
    edgeCode: string | undefined
    issuerCode: string | undefined
    orientationCode: string | undefined
    rimCode: string | undefined
    rulerCode: string | undefined
  }) => Promise<void>
}

export function HomeFilters({
  catalogues,
  compositions,
  currencies,
  edges,
  issuers,
  orientations,
  rims,
  rulers,
  selectedCatalogueCode,
  selectedCompositionCode,
  selectedCurrencyCode,
  selectedDemonetization,
  selectedEdgeCode,
  selectedIssuerCode,
  selectedOrientationCode,
  selectedRimCode,
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
          key: "composition",
          label: "Composition",
          icon: <Box strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: compositions.map((composition) => ({
            value: composition.code,
            label: getCompositionOptionLabel(composition),
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
          key: "demonetization",
          label: "Demonetization Status",
          icon: <BanknoteX strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: demonetizationFilterOptions.map((option) => ({
            value: option.code,
            label: option.name,
          })),
        },
        {
          key: "edge",
          label: "Edge",
          icon: <CircleDashed strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: edges.map((edge) => ({
            value: edge.code,
            label: getEdgeOptionLabel(edge),
          })),
        },
        {
          key: "currency",
          label: "Currency",
          icon: <DollarSign strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: currencies.map((currency) => ({
            value: currency.code,
            label: getCurrencyOptionLabel(currency),
          })),
        },
        {
          key: "orientation",
          label: "Orientation",
          icon: <CircleArrowDown strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: orientations.map((orientation) => ({
            value: orientation.code,
            label: getOrientationOptionLabel(orientation),
          })),
        },
        {
          key: "rim",
          label: "Rim",
          icon: <Circle strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: rims.map((rim) => ({
            value: rim.code,
            label: getRimOptionLabel(rim),
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
    ...(selectedCompositionCode
      ? [createFilter("composition", "is", [selectedCompositionCode])]
      : []),
    ...(selectedCurrencyCode
      ? [createFilter("currency", "is", [selectedCurrencyCode])]
      : []),
    ...(selectedDemonetization
      ? [createFilter("demonetization", "is", [selectedDemonetization])]
      : []),
    ...(selectedEdgeCode
      ? [createFilter("edge", "is", [selectedEdgeCode])]
      : []),
    ...(selectedIssuerCode
      ? [createFilter("issuer", "is", [selectedIssuerCode])]
      : []),
    ...(selectedOrientationCode
      ? [createFilter("orientation", "is", [selectedOrientationCode])]
      : []),
    ...(selectedRimCode ? [createFilter("rim", "is", [selectedRimCode])] : []),
    ...(selectedRulerCode
      ? [createFilter("ruler", "is", [selectedRulerCode])]
      : []),
  ]

  async function handleFiltersChange(nextFilters: Filter<string>[]) {
    const catalogueFilter = nextFilters.find(
      (filter) => filter.field === "catalogue"
    )
    const catalogueCode = catalogueFilter?.values[0]
    const compositionFilter = nextFilters.find(
      (filter) => filter.field === "composition"
    )
    const compositionCode = compositionFilter?.values[0]
    const currencyFilter = nextFilters.find(
      (filter) => filter.field === "currency"
    )
    const currencyCode = currencyFilter?.values[0]
    const demonetizationFilter = nextFilters.find(
      (filter) => filter.field === "demonetization"
    )
    const demonetization = demonetizationFilter?.values[0]
    const edgeFilter = nextFilters.find((filter) => filter.field === "edge")
    const edgeCode = edgeFilter?.values[0]
    const issuerFilter = nextFilters.find((filter) => filter.field === "issuer")
    const issuerCode = issuerFilter?.values[0]
    const orientationFilter = nextFilters.find(
      (filter) => filter.field === "orientation"
    )
    const orientationCode = orientationFilter?.values[0]
    const rimFilter = nextFilters.find((filter) => filter.field === "rim")
    const rimCode = rimFilter?.values[0]
    const rulerFilter = nextFilters.find((filter) => filter.field === "ruler")
    const rulerCode = rulerFilter?.values[0]

    await onFiltersChange({
      catalogueCode:
        typeof catalogueCode === "string" && catalogueCode.length > 0
          ? catalogueCode
          : undefined,
      compositionCode:
        typeof compositionCode === "string" && compositionCode.length > 0
          ? compositionCode
          : undefined,
      currencyCode:
        typeof currencyCode === "string" && currencyCode.length > 0
          ? currencyCode
          : undefined,
      demonetization:
        demonetization === "demonetized" ||
        demonetization === "not-demonetized" ||
        demonetization === "unknown"
          ? demonetization
          : undefined,
      edgeCode:
        typeof edgeCode === "string" && edgeCode.length > 0
          ? edgeCode
          : undefined,
      issuerCode:
        typeof issuerCode === "string" && issuerCode.length > 0
          ? issuerCode
          : undefined,
      orientationCode:
        typeof orientationCode === "string" && orientationCode.length > 0
          ? orientationCode
          : undefined,
      rimCode:
        typeof rimCode === "string" && rimCode.length > 0 ? rimCode : undefined,
      rulerCode:
        typeof rulerCode === "string" && rulerCode.length > 0
          ? rulerCode
          : undefined,
    })
  }

  async function clearFilters() {
    await onFiltersChange({
      catalogueCode: undefined,
      compositionCode: undefined,
      currencyCode: undefined,
      demonetization: undefined,
      edgeCode: undefined,
      issuerCode: undefined,
      orientationCode: undefined,
      rimCode: undefined,
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
