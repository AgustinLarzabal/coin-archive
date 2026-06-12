import type {
  CatalogueOption,
  CompositionOption,
  CurrencyOption,
  DemonetizationFilterValue,
  EdgeOption,
  IssuerOption,
  MintOption,
  OrientationOption,
  RimOption,
  RulerOption,
  ShapeOption,
  TechniqueOption,
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
  Factory,
  Diamond,
  Anvil,
} from "lucide-react"
import {
  demonetizationFilterOptions,
  getCatalogueOptionLabel,
  getCompositionOptionLabel,
  getCurrencyOptionLabel,
  getEdgeOptionLabel,
  getMintOptionLabel,
  getOrientationOptionLabel,
  getRimOptionLabel,
  getRulerOptionLabel,
  getShapeOptionLabel,
  getTechniqueOptionLabel,
} from "../lib/coin-search"

type HomeFiltersProps = {
  catalogues: CatalogueOption[]
  compositions: CompositionOption[]
  currencies: CurrencyOption[]
  edges: EdgeOption[]
  issuers: IssuerOption[]
  mints: MintOption[]
  orientations: OrientationOption[]
  rims: RimOption[]
  rulers: RulerOption[]
  shapes: ShapeOption[]
  techniques: TechniqueOption[]
  selectedCatalogueCode?: string
  selectedCompositionCode?: string
  selectedCurrencyCode?: string
  selectedEdgeCode?: string
  selectedDemonetization?: DemonetizationFilterValue
  selectedIssuerCode?: string
  selectedMintCode?: string
  selectedOrientationCode?: string
  selectedRimCode?: string
  selectedRulerCode?: string
  selectedShapeCode?: string
  selectedTechniqueCode?: string
  onFiltersChange: (filters: {
    catalogueCode: string | undefined
    compositionCode: string | undefined
    currencyCode: string | undefined
    demonetization: DemonetizationFilterValue | undefined
    edgeCode: string | undefined
    issuerCode: string | undefined
    mintCode: string | undefined
    orientationCode: string | undefined
    rimCode: string | undefined
    rulerCode: string | undefined
    shapeCode: string | undefined
    techniqueCode: string | undefined
  }) => Promise<void>
}

export function HomeFilters({
  catalogues,
  compositions,
  currencies,
  edges,
  issuers,
  mints,
  orientations,
  rims,
  rulers,
  shapes,
  techniques,
  selectedCatalogueCode,
  selectedCompositionCode,
  selectedCurrencyCode,
  selectedDemonetization,
  selectedEdgeCode,
  selectedIssuerCode,
  selectedMintCode,
  selectedOrientationCode,
  selectedRimCode,
  selectedRulerCode,
  selectedShapeCode,
  selectedTechniqueCode,
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
          key: "mint",
          label: "Mint",
          icon: <Factory strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: mints.map((mint) => ({
            value: mint.code,
            label: getMintOptionLabel(mint),
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
          key: "shape",
          label: "Shape",
          icon: <Diamond strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: shapes.map((shape) => ({
            value: shape.code,
            label: getShapeOptionLabel(shape),
          })),
        },
        {
          key: "technique",
          label: "Minting Technique",
          icon: <Anvil strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: techniques.map((technique) => ({
            value: technique.code,
            label: getTechniqueOptionLabel(technique),
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
    ...(selectedMintCode
      ? [createFilter("mint", "is", [selectedMintCode])]
      : []),
    ...(selectedOrientationCode
      ? [createFilter("orientation", "is", [selectedOrientationCode])]
      : []),
    ...(selectedRimCode ? [createFilter("rim", "is", [selectedRimCode])] : []),
    ...(selectedShapeCode
      ? [createFilter("shape", "is", [selectedShapeCode])]
      : []),
    ...(selectedTechniqueCode
      ? [createFilter("technique", "is", [selectedTechniqueCode])]
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
    const mintFilter = nextFilters.find((filter) => filter.field === "mint")
    const mintCode = mintFilter?.values[0]
    const orientationFilter = nextFilters.find(
      (filter) => filter.field === "orientation"
    )
    const orientationCode = orientationFilter?.values[0]
    const rimFilter = nextFilters.find((filter) => filter.field === "rim")
    const rimCode = rimFilter?.values[0]
    const shapeFilter = nextFilters.find((filter) => filter.field === "shape")
    const shapeCode = shapeFilter?.values[0]
    const techniqueFilter = nextFilters.find(
      (filter) => filter.field === "technique"
    )
    const techniqueCode = techniqueFilter?.values[0]
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
      mintCode:
        typeof mintCode === "string" && mintCode.length > 0
          ? mintCode
          : undefined,
      orientationCode:
        typeof orientationCode === "string" && orientationCode.length > 0
          ? orientationCode
          : undefined,
      rimCode:
        typeof rimCode === "string" && rimCode.length > 0 ? rimCode : undefined,
      shapeCode:
        typeof shapeCode === "string" && shapeCode.length > 0
          ? shapeCode
          : undefined,
      techniqueCode:
        typeof techniqueCode === "string" && techniqueCode.length > 0
          ? techniqueCode
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
      compositionCode: undefined,
      currencyCode: undefined,
      demonetization: undefined,
      edgeCode: undefined,
      issuerCode: undefined,
      mintCode: undefined,
      orientationCode: undefined,
      rimCode: undefined,
      rulerCode: undefined,
      shapeCode: undefined,
      techniqueCode: undefined,
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
