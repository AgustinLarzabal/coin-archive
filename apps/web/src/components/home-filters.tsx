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
  SlidersHorizontal,
  CircleDollarSign,
  Scale,
} from "lucide-react"
import type { FormEvent } from "react"
import { useState } from "react"
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
import type { PositiveNumberFilterValue } from "../lib/coin-search"
import {
  CustomDiameterRangeInput,
  CustomFaceValueRangeInput,
  CustomSliderRangeInput,
  CustomThicknessRangeInput,
  CustomWeightRangeInput,
  getDiameterRangeValue,
  getFaceValueRangeValue,
  getIssueYearRangeValue,
  getThicknessRangeValue,
  getWeightRangeValue,
  issueYearBounds,
} from "./home-filter-range-inputs"
import { Input } from "@workspace/ui/components/input"

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
  selectedFromYear?: number
  selectedMaxDiameter?: number
  selectedMaxThickness?: number
  selectedMaxValue?: number
  selectedMaxWeight?: number
  selectedMinDiameter?: number
  selectedMinThickness?: number
  selectedMinValue?: number
  selectedMinWeight?: number
  selectedMintCode?: string
  selectedOrientationCode?: string
  selectedReferenceNumber?: string
  selectedRimCode?: string
  selectedRulerCode?: string
  selectedShapeCode?: string
  selectedTechniqueCode?: string
  selectedThemeCode?: string
  selectedToYear?: number
  onFiltersChange: (filters: {
    catalogueCode: string | undefined
    compositionCode: string | undefined
    currencyCode: string | undefined
    distributionCode: string | undefined
    demonetization: DemonetizationFilterValue | undefined
    edgeCode: string | undefined
    engraverCode: string | undefined
    fromYear: number | undefined
    issuerCode: string | undefined
    maxDiameter: PositiveNumberFilterValue
    maxThickness: PositiveNumberFilterValue
    maxValue: PositiveNumberFilterValue
    maxWeight: PositiveNumberFilterValue
    minDiameter: PositiveNumberFilterValue
    minThickness: PositiveNumberFilterValue
    minValue: PositiveNumberFilterValue
    minWeight: PositiveNumberFilterValue
    mintCode: string | undefined
    orientationCode: string | undefined
    referenceNumber: string | undefined
    rimCode: string | undefined
    rulerCode: string | undefined
    shapeCode: string | undefined
    techniqueCode: string | undefined
    themeCode: string | undefined
    toYear: number | undefined
  }) => Promise<void>
}

type HomeFilterValueSet = Parameters<HomeFiltersProps["onFiltersChange"]>[0]

type PendingRangeField = "faceValue" | "weight" | "diameter" | "thickness"

const pendingRangeFields: PendingRangeField[] = [
  "faceValue",
  "weight",
  "diameter",
  "thickness",
]

const emptyPendingRangeFilters: Record<PendingRangeField, boolean> = {
  faceValue: false,
  weight: false,
  diameter: false,
  thickness: false,
}

const emptyFilterValues: HomeFilterValueSet = {
  catalogueCode: undefined,
  compositionCode: undefined,
  currencyCode: undefined,
  distributionCode: undefined,
  demonetization: undefined,
  edgeCode: undefined,
  engraverCode: undefined,
  fromYear: undefined,
  issuerCode: undefined,
  maxDiameter: undefined,
  maxThickness: undefined,
  maxValue: undefined,
  maxWeight: undefined,
  minDiameter: undefined,
  minThickness: undefined,
  minValue: undefined,
  minWeight: undefined,
  mintCode: undefined,
  orientationCode: undefined,
  referenceNumber: undefined,
  rimCode: undefined,
  rulerCode: undefined,
  shapeCode: undefined,
  techniqueCode: undefined,
  themeCode: undefined,
  toYear: undefined,
}

function getFilterByField(filters: Filter[], field: Filter["field"]) {
  return filters.find((filter) => filter.field === field)
}

function hasFilter(filters: Filter[], field: Filter["field"]) {
  return filters.some((filter) => filter.field === field)
}

function getSingleFilterValue(filters: Filter[], field: Filter["field"]) {
  return getFilterByField(filters, field)?.values[0]
}

function toOptionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function toOptionalTrimmedString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined
}

function toDemonetizationFilterValue(value: unknown) {
  return value === "demonetized" ||
    value === "not-demonetized" ||
    value === "unknown"
    ? value
    : undefined
}

function createOptionalFilter(
  field: string,
  value: string | DemonetizationFilterValue | undefined
) {
  return value ? [createFilter(field, "is", [value])] : []
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
  selectedFromYear,
  selectedMaxDiameter,
  selectedMaxThickness,
  selectedMaxValue,
  selectedMaxWeight,
  selectedMinDiameter,
  selectedMinThickness,
  selectedMinValue,
  selectedMinWeight,
  selectedMintCode,
  selectedOrientationCode,
  selectedReferenceNumber,
  selectedRimCode,
  selectedRulerCode,
  selectedShapeCode,
  selectedTechniqueCode,
  selectedThemeCode,
  selectedToYear,
  onFiltersChange,
}: HomeFiltersProps) {
  const [lastAddedValues, setLastAddedValues] = useState<unknown[] | null>(null)
  const [pendingRangeFilters, setPendingRangeFilters] = useState<
    Record<PendingRangeField, boolean>
  >(emptyPendingRangeFilters)

  const fields: FilterFieldConfig[] = [
    {
      group: "Basic",
      fields: [
        {
          key: "issuerYear",
          label: "Issue Year",
          icon: <SlidersHorizontal strokeWidth={2} className="size-3.5" />,
          type: "custom",
          className: "w-36",
          operators: [{ value: "between", label: "between" }],
          defaultOperator: "between",
          customRenderer: ({ values, onChange }) => (
            <CustomSliderRangeInput
              values={values}
              onChange={onChange}
              autoFocus={values === lastAddedValues}
            />
          ),
        },
        {
          key: "faceValue",
          label: "Face Value",
          icon: <CircleDollarSign strokeWidth={2} className="size-3.5" />,
          type: "custom",
          className: "w-36",
          operators: [{ value: "between", label: "between" }],
          defaultOperator: "between",
          customRenderer: ({ values, onChange }) => (
            <CustomFaceValueRangeInput
              values={values}
              onChange={onChange}
              autoFocus={values === lastAddedValues}
            />
          ),
        },
        {
          key: "weight",
          label: "Weight",
          icon: <Scale strokeWidth={2} className="size-3.5" />,
          type: "custom",
          className: "w-36",
          operators: [{ value: "between", label: "between" }],
          defaultOperator: "between",
          customRenderer: ({ values, onChange }) => (
            <CustomWeightRangeInput
              values={values}
              onChange={onChange}
              autoFocus={values === lastAddedValues}
            />
          ),
        },
        {
          key: "diameter",
          label: "Diameter",
          icon: <Circle strokeWidth={2} className="size-3.5" />,
          type: "custom",
          className: "w-36",
          operators: [{ value: "between", label: "between" }],
          defaultOperator: "between",
          customRenderer: ({ values, onChange }) => (
            <CustomDiameterRangeInput
              values={values}
              onChange={onChange}
              autoFocus={values === lastAddedValues}
            />
          ),
        },
        {
          key: "thickness",
          label: "Thickness",
          icon: <SlidersHorizontal strokeWidth={2} className="size-3.5" />,
          type: "custom",
          className: "w-36",
          operators: [{ value: "between", label: "between" }],
          defaultOperator: "between",
          customRenderer: ({ values, onChange }) => (
            <CustomThicknessRangeInput
              values={values}
              onChange={onChange}
              autoFocus={values === lastAddedValues}
            />
          ),
        },
      ],
    },
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
          icon: <CircleDollarSign strokeWidth={2} />,
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

  const filters: Filter[] = [
    ...(selectedFromYear !== undefined || selectedToYear !== undefined
      ? [
          createFilter("issuerYear", "between", [
            {
              min: selectedFromYear ?? issueYearBounds.min,
              max: selectedToYear ?? issueYearBounds.max,
            },
          ]),
        ]
      : []),
    ...(selectedMinValue !== undefined ||
    selectedMaxValue !== undefined ||
    pendingRangeFilters.faceValue
      ? [
          createFilter("faceValue", "between", [
            {
              minValue: selectedMinValue,
              maxValue: selectedMaxValue,
            },
          ]),
        ]
      : []),
    ...(selectedMinWeight !== undefined ||
    selectedMaxWeight !== undefined ||
    pendingRangeFilters.weight
      ? [
          createFilter("weight", "between", [
            {
              minWeight: selectedMinWeight,
              maxWeight: selectedMaxWeight,
            },
          ]),
        ]
      : []),
    ...(selectedMinDiameter !== undefined ||
    selectedMaxDiameter !== undefined ||
    pendingRangeFilters.diameter
      ? [
          createFilter("diameter", "between", [
            {
              minDiameter: selectedMinDiameter,
              maxDiameter: selectedMaxDiameter,
            },
          ]),
        ]
      : []),
    ...(selectedMinThickness !== undefined ||
    selectedMaxThickness !== undefined ||
    pendingRangeFilters.thickness
      ? [
          createFilter("thickness", "between", [
            {
              minThickness: selectedMinThickness,
              maxThickness: selectedMaxThickness,
            },
          ]),
        ]
      : []),
    ...createOptionalFilter("catalogue", selectedCatalogueCode),
    ...createOptionalFilter("composition", selectedCompositionCode),
    ...createOptionalFilter("currency", selectedCurrencyCode),
    ...createOptionalFilter("distribution", selectedDistributionCode),
    ...createOptionalFilter("demonetization", selectedDemonetization),
    ...createOptionalFilter("edge", selectedEdgeCode),
    ...createOptionalFilter("engraver", selectedEngraverCode),
    ...createOptionalFilter("issuer", selectedIssuerCode),
    ...createOptionalFilter("mint", selectedMintCode),
    ...createOptionalFilter("orientation", selectedOrientationCode),
    ...createOptionalFilter("rim", selectedRimCode),
    ...createOptionalFilter("shape", selectedShapeCode),
    ...createOptionalFilter("technique", selectedTechniqueCode),
    ...createOptionalFilter("theme", selectedThemeCode),
    ...createOptionalFilter("ruler", selectedRulerCode),
  ]

  async function handleFiltersChange(nextFilters: Filter[]) {
    const addedFilter = nextFilters.find(
      (nextFilter) => !filters.some((filter) => filter.id === nextFilter.id)
    )

    if (addedFilter) {
      setLastAddedValues(addedFilter.values)
    }

    setPendingRangeFilters(
      pendingRangeFields.reduce(
        (nextPendingFilters, field) => ({
          ...nextPendingFilters,
          [field]: hasFilter(nextFilters, field),
        }),
        emptyPendingRangeFilters
      )
    )

    const issuerYearRange = hasFilter(nextFilters, "issuerYear")
      ? getIssueYearRangeValue(getSingleFilterValue(nextFilters, "issuerYear"))
      : undefined
    const faceValueRange = hasFilter(nextFilters, "faceValue")
      ? getFaceValueRangeValue(getSingleFilterValue(nextFilters, "faceValue"))
      : undefined
    const weightRange = hasFilter(nextFilters, "weight")
      ? getWeightRangeValue(getSingleFilterValue(nextFilters, "weight"))
      : undefined
    const diameterRange = hasFilter(nextFilters, "diameter")
      ? getDiameterRangeValue(getSingleFilterValue(nextFilters, "diameter"))
      : undefined
    const thicknessRange = hasFilter(nextFilters, "thickness")
      ? getThicknessRangeValue(getSingleFilterValue(nextFilters, "thickness"))
      : undefined
    const catalogueCode = getSingleFilterValue(nextFilters, "catalogue")
    const compositionCode = getSingleFilterValue(nextFilters, "composition")
    const currencyCode = getSingleFilterValue(nextFilters, "currency")
    const distributionCode = getSingleFilterValue(nextFilters, "distribution")
    const demonetization = getSingleFilterValue(nextFilters, "demonetization")
    const edgeCode = getSingleFilterValue(nextFilters, "edge")
    const engraverCode = getSingleFilterValue(nextFilters, "engraver")
    const issuerCode = getSingleFilterValue(nextFilters, "issuer")
    const mintCode = getSingleFilterValue(nextFilters, "mint")
    const orientationCode = getSingleFilterValue(nextFilters, "orientation")
    const rimCode = getSingleFilterValue(nextFilters, "rim")
    const shapeCode = getSingleFilterValue(nextFilters, "shape")
    const techniqueCode = getSingleFilterValue(nextFilters, "technique")
    const themeCode = getSingleFilterValue(nextFilters, "theme")
    const rulerCode = getSingleFilterValue(nextFilters, "ruler")

    await onFiltersChange({
      catalogueCode: toOptionalString(catalogueCode),
      compositionCode: toOptionalString(compositionCode),
      currencyCode: toOptionalString(currencyCode),
      distributionCode: toOptionalString(distributionCode),
      demonetization: toDemonetizationFilterValue(demonetization),
      edgeCode: toOptionalString(edgeCode),
      engraverCode: toOptionalString(engraverCode),
      fromYear: issuerYearRange?.min,
      issuerCode: toOptionalString(issuerCode),
      maxDiameter: diameterRange?.maxDiameter,
      maxThickness: thicknessRange?.maxThickness,
      maxValue: faceValueRange?.maxValue,
      maxWeight: weightRange?.maxWeight,
      minDiameter: diameterRange?.minDiameter,
      minThickness: thicknessRange?.minThickness,
      minValue: faceValueRange?.minValue,
      minWeight: weightRange?.minWeight,
      mintCode: toOptionalString(mintCode),
      orientationCode: toOptionalString(orientationCode),
      referenceNumber: toOptionalString(catalogueCode)
        ? selectedReferenceNumber
        : undefined,
      rimCode: toOptionalString(rimCode),
      shapeCode: toOptionalString(shapeCode),
      techniqueCode: toOptionalString(techniqueCode),
      themeCode: toOptionalString(themeCode),
      toYear: issuerYearRange?.max,
      rulerCode: toOptionalString(rulerCode),
    })
  }

  async function clearFilters() {
    setPendingRangeFilters(emptyPendingRangeFilters)

    await onFiltersChange(emptyFilterValues)
  }

  async function handleReferenceNumberSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!selectedCatalogueCode) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const referenceNumber = formData.get("referenceNumber")

    await onFiltersChange({
      ...emptyFilterValues,
      catalogueCode: selectedCatalogueCode,
      compositionCode: selectedCompositionCode,
      currencyCode: selectedCurrencyCode,
      distributionCode: selectedDistributionCode,
      demonetization: selectedDemonetization,
      edgeCode: selectedEdgeCode,
      engraverCode: selectedEngraverCode,
      fromYear: selectedFromYear,
      issuerCode: selectedIssuerCode,
      maxDiameter: selectedMaxDiameter,
      maxThickness: selectedMaxThickness,
      maxValue: selectedMaxValue,
      maxWeight: selectedMaxWeight,
      minDiameter: selectedMinDiameter,
      minThickness: selectedMinThickness,
      minValue: selectedMinValue,
      minWeight: selectedMinWeight,
      mintCode: selectedMintCode,
      orientationCode: selectedOrientationCode,
      referenceNumber: toOptionalTrimmedString(referenceNumber),
      rimCode: selectedRimCode,
      rulerCode: selectedRulerCode,
      shapeCode: selectedShapeCode,
      techniqueCode: selectedTechniqueCode,
      themeCode: selectedThemeCode,
      toYear: selectedToYear,
    })
  }

  return (
    <div className="mb-5 space-y-2">
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

      {selectedCatalogueCode ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={handleReferenceNumberSubmit}
        >
          <Input
            aria-label="Filter by reference number"
            className="md:max-w-40"
            defaultValue={selectedReferenceNumber ?? ""}
            key={`reference-number-${selectedReferenceNumber ?? ""}`}
            name="referenceNumber"
            placeholder="Reference number"
          />
          <Button variant="outline" type="submit">
            Apply reference
          </Button>
        </form>
      ) : null}
    </div>
  )
}
