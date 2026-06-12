import type {
  CatalogueOption,
  CompositionOption,
  CurrencyOption,
  DemonetizationFilterValue,
  DistributionOption,
  EdgeOption,
  EngraverOption,
  IssuerOption,
  MintOption,
  OrientationOption,
  RimOption,
  RulerOption,
  ShapeOption,
  TechniqueOption,
  ThemeOption,
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
  Circle,
  Factory,
  Diamond,
  Anvil,
  Coins,
  CircleX,
  PenTool,
  Map,
} from "lucide-react"
import {
  demonetizationFilterOptions,
  getCatalogueOptionLabel,
  getCompositionOptionLabel,
  getCurrencyOptionLabel,
  getDistributionOptionLabel,
  getEdgeOptionLabel,
  getEngraverOptionLabel,
  getMintOptionLabel,
  getOrientationOptionLabel,
  getRimOptionLabel,
  getRulerOptionLabel,
  getShapeOptionLabel,
  getTechniqueOptionLabel,
  getThemeOptionLabel,
} from "../lib/coin-search"

type HomeFiltersProps = {
  catalogues: CatalogueOption[]
  compositions: CompositionOption[]
  currencies: CurrencyOption[]
  distributions: DistributionOption[]
  edges: EdgeOption[]
  engravers: EngraverOption[]
  issuers: IssuerOption[]
  mints: MintOption[]
  orientations: OrientationOption[]
  rims: RimOption[]
  rulers: RulerOption[]
  shapes: ShapeOption[]
  techniques: TechniqueOption[]
  themes: ThemeOption[]
  selectedCatalogueCode?: string
  selectedCompositionCode?: string
  selectedCurrencyCode?: string
  selectedDistributionCode?: string
  selectedEdgeCode?: string
  selectedEngraverCode?: string
  selectedDemonetization?: DemonetizationFilterValue
  selectedIssuerCode?: string
  selectedMintCode?: string
  selectedOrientationCode?: string
  selectedRimCode?: string
  selectedRulerCode?: string
  selectedShapeCode?: string
  selectedTechniqueCode?: string
  selectedThemeCode?: string
  onFiltersChange: (filters: {
    catalogueCode: string | undefined
    compositionCode: string | undefined
    currencyCode: string | undefined
    distributionCode: string | undefined
    demonetization: DemonetizationFilterValue | undefined
    edgeCode: string | undefined
    engraverCode: string | undefined
    issuerCode: string | undefined
    mintCode: string | undefined
    orientationCode: string | undefined
    rimCode: string | undefined
    rulerCode: string | undefined
    shapeCode: string | undefined
    techniqueCode: string | undefined
    themeCode: string | undefined
  }) => Promise<void>
}

export function HomeFilters({
  catalogues,
  compositions,
  currencies,
  distributions,
  edges,
  engravers,
  issuers,
  mints,
  orientations,
  rims,
  rulers,
  shapes,
  techniques,
  themes,
  selectedCatalogueCode,
  selectedCompositionCode,
  selectedCurrencyCode,
  selectedDistributionCode,
  selectedDemonetization,
  selectedEdgeCode,
  selectedEngraverCode,
  selectedIssuerCode,
  selectedMintCode,
  selectedOrientationCode,
  selectedRimCode,
  selectedRulerCode,
  selectedShapeCode,
  selectedTechniqueCode,
  selectedThemeCode,
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
          key: "engraver",
          label: "Engraver",
          icon: <PenTool strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: engravers.map((engraver) => ({
            value: engraver.code,
            label: getEngraverOptionLabel(engraver),
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
          key: "distribution",
          label: "Distribution",
          icon: <Coins strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: distributions.map((distribution) => ({
            value: distribution.code,
            label: getDistributionOptionLabel(distribution),
          })),
        },
        {
          key: "demonetization",
          label: "Demonetization Status",
          icon: <CircleX strokeWidth={2} />,
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
          key: "theme",
          label: "Theme",
          icon: <Map strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: themes.map((theme) => ({
            value: theme.code,
            label: getThemeOptionLabel(theme),
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
    ...(selectedDistributionCode
      ? [createFilter("distribution", "is", [selectedDistributionCode])]
      : []),
    ...(selectedDemonetization
      ? [createFilter("demonetization", "is", [selectedDemonetization])]
      : []),
    ...(selectedEdgeCode
      ? [createFilter("edge", "is", [selectedEdgeCode])]
      : []),
    ...(selectedEngraverCode
      ? [createFilter("engraver", "is", [selectedEngraverCode])]
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
    ...(selectedThemeCode
      ? [createFilter("theme", "is", [selectedThemeCode])]
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
    const distributionFilter = nextFilters.find(
      (filter) => filter.field === "distribution"
    )
    const distributionCode = distributionFilter?.values[0]
    const demonetizationFilter = nextFilters.find(
      (filter) => filter.field === "demonetization"
    )
    const demonetization = demonetizationFilter?.values[0]
    const edgeFilter = nextFilters.find((filter) => filter.field === "edge")
    const edgeCode = edgeFilter?.values[0]
    const engraverFilter = nextFilters.find(
      (filter) => filter.field === "engraver"
    )
    const engraverCode = engraverFilter?.values[0]
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
    const themeFilter = nextFilters.find((filter) => filter.field === "theme")
    const themeCode = themeFilter?.values[0]
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
      distributionCode:
        typeof distributionCode === "string" && distributionCode.length > 0
          ? distributionCode
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
      engraverCode:
        typeof engraverCode === "string" && engraverCode.length > 0
          ? engraverCode
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
      themeCode:
        typeof themeCode === "string" && themeCode.length > 0
          ? themeCode
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
      distributionCode: undefined,
      demonetization: undefined,
      edgeCode: undefined,
      engraverCode: undefined,
      issuerCode: undefined,
      mintCode: undefined,
      orientationCode: undefined,
      rimCode: undefined,
      rulerCode: undefined,
      shapeCode: undefined,
      techniqueCode: undefined,
      themeCode: undefined,
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
