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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Input } from "@workspace/ui/components/input"
import { Slider } from "@workspace/ui/components/slider"
import { useEffect, useState } from "react"
import type { PositiveNumberFilterValue } from "../lib/coin-search"

const issueYearBounds = {
  min: -1000,
  max: new Date().getUTCFullYear(),
} as const

type CustomRendererProps = {
  values: unknown[]
  onChange: (values: unknown[]) => void
  autoFocus?: boolean
}

const faceValueRangeInputFields = [
  {
    name: "minValue",
    ariaLabel: "Minimum face value in major units",
    placeholder: "Min face value",
  },
  {
    name: "maxValue",
    ariaLabel: "Maximum face value in major units",
    placeholder: "Max face value",
  },
] as const

type FaceValueRangeValue = {
  maxValue: PositiveNumberFilterValue
  minValue: PositiveNumberFilterValue
}

type WeightRangeValue = {
  maxWeight: PositiveNumberFilterValue
  minWeight: PositiveNumberFilterValue
}

type DiameterRangeValue = {
  maxDiameter: PositiveNumberFilterValue
  minDiameter: PositiveNumberFilterValue
}

type ThicknessRangeValue = {
  maxThickness: PositiveNumberFilterValue
  minThickness: PositiveNumberFilterValue
}

function isIssueYearRangeValue(
  value: unknown
): value is { min: number; max: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "min" in value &&
    "max" in value &&
    typeof value.min === "number" &&
    typeof value.max === "number"
  )
}

function getIssueYearRangeValue(value: unknown) {
  if (isIssueYearRangeValue(value)) {
    return value
  }

  return {
    min: issueYearBounds.min,
    max: issueYearBounds.max,
  }
}

function isFaceValueRangeValue(value: unknown): value is FaceValueRangeValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "minValue" in value &&
    "maxValue" in value
  )
}

function getFaceValueRangeValue(value: unknown): FaceValueRangeValue {
  if (isFaceValueRangeValue(value)) {
    return value
  }

  return {
    minValue: undefined,
    maxValue: undefined,
  }
}

function isWeightRangeValue(value: unknown): value is WeightRangeValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "minWeight" in value &&
    "maxWeight" in value
  )
}

function getWeightRangeValue(value: unknown): WeightRangeValue {
  if (isWeightRangeValue(value)) {
    return value
  }

  return {
    minWeight: undefined,
    maxWeight: undefined,
  }
}

function isDiameterRangeValue(value: unknown): value is DiameterRangeValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "minDiameter" in value &&
    "maxDiameter" in value
  )
}

function getDiameterRangeValue(value: unknown): DiameterRangeValue {
  if (isDiameterRangeValue(value)) {
    return value
  }

  return {
    minDiameter: undefined,
    maxDiameter: undefined,
  }
}

function isThicknessRangeValue(value: unknown): value is ThicknessRangeValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "minThickness" in value &&
    "maxThickness" in value
  )
}

function getThicknessRangeValue(value: unknown): ThicknessRangeValue {
  if (isThicknessRangeValue(value)) {
    return value
  }

  return {
    minThickness: undefined,
    maxThickness: undefined,
  }
}

function CustomSliderRangeInput({
  values,
  onChange,
  autoFocus,
}: CustomRendererProps) {
  const [range, setRange] = useState<number[]>(
    isIssueYearRangeValue(values[0])
      ? [values[0].min, values[0].max]
      : [issueYearBounds.min, issueYearBounds.max]
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => setIsOpen(true), 400)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  const handleApply = () => {
    onChange([{ min: range[0], max: range[1] }])
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={<span />}>
        {range[0]} - {range[1]}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-4"
        align="start"
        sideOffset={8}
        alignOffset={-8}
      >
        <div className="space-y-2.5">
          <div className="space-y-4 pt-2.5">
            <Slider
              value={range}
              onValueChange={(value) =>
                setRange(Array.isArray(value) ? [...value] : [value])
              }
              max={issueYearBounds.max}
              min={issueYearBounds.min}
              step={1}
              className="w-[200px]"
            />
            <div className="flex justify-between ps-1.5 text-xs text-muted-foreground">
              <span>{issueYearBounds.min}</span>
              <span>{issueYearBounds.max}</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" variant="outline" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CustomFaceValueRangeInput({
  values,
  onChange,
  autoFocus,
}: CustomRendererProps) {
  const selectedRange = getFaceValueRangeValue(values[0])
  const [range, setRange] = useState({
    minValue: selectedRange.minValue?.toString() ?? "",
    maxValue: selectedRange.maxValue?.toString() ?? "",
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => setIsOpen(true), 400)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  const handleApply = () => {
    onChange([
      {
        minValue: range.minValue,
        maxValue: range.maxValue,
      },
    ])
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  const displayValue =
    range.minValue || range.maxValue
      ? `${range.minValue || "any"} - ${range.maxValue || "any"}`
      : "Set range"

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={<span />}>{displayValue}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-4"
        align="start"
        sideOffset={8}
        alignOffset={-8}
      >
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-2">
            {faceValueRangeInputFields.map(
              ({ ariaLabel, name, placeholder }) => (
                <Input
                  aria-label={ariaLabel}
                  className="w-36"
                  key={name}
                  name={name}
                  onChange={(event) =>
                    setRange((currentRange) => ({
                      ...currentRange,
                      [name]: event.target.value,
                    }))
                  }
                  placeholder={placeholder}
                  step="0.000001"
                  type="number"
                  value={range[name]}
                />
              )
            )}
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" variant="outline" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CustomWeightRangeInput({
  values,
  onChange,
  autoFocus,
}: CustomRendererProps) {
  const selectedRange = getWeightRangeValue(values[0])
  const [range, setRange] = useState({
    minWeight: selectedRange.minWeight?.toString() ?? "",
    maxWeight: selectedRange.maxWeight?.toString() ?? "",
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => setIsOpen(true), 400)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  const handleApply = () => {
    onChange([
      {
        minWeight: range.minWeight,
        maxWeight: range.maxWeight,
      },
    ])
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  const displayValue =
    range.minWeight || range.maxWeight
      ? `${range.minWeight || "any"} - ${range.maxWeight || "any"} g`
      : "Set range"

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={<span />}>{displayValue}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-4"
        align="start"
        sideOffset={8}
        alignOffset={-8}
      >
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <Input
              aria-label="Minimum weight in grams"
              className="w-36"
              onChange={(event) =>
                setRange((currentRange) => ({
                  ...currentRange,
                  minWeight: event.target.value,
                }))
              }
              placeholder="Min weight (g)"
              step="0.01"
              type="number"
              value={range.minWeight}
            />
            <Input
              aria-label="Maximum weight in grams"
              className="w-36"
              onChange={(event) =>
                setRange((currentRange) => ({
                  ...currentRange,
                  maxWeight: event.target.value,
                }))
              }
              placeholder="Max weight (g)"
              step="0.01"
              type="number"
              value={range.maxWeight}
            />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" variant="outline" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CustomDiameterRangeInput({
  values,
  onChange,
  autoFocus,
}: CustomRendererProps) {
  const selectedRange = getDiameterRangeValue(values[0])
  const [range, setRange] = useState({
    minDiameter: selectedRange.minDiameter?.toString() ?? "",
    maxDiameter: selectedRange.maxDiameter?.toString() ?? "",
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => setIsOpen(true), 400)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  const handleApply = () => {
    onChange([
      {
        minDiameter: range.minDiameter,
        maxDiameter: range.maxDiameter,
      },
    ])
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  const displayValue =
    range.minDiameter || range.maxDiameter
      ? `${range.minDiameter || "any"} - ${range.maxDiameter || "any"} mm`
      : "Set range"

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={<span />}>{displayValue}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-4"
        align="start"
        sideOffset={8}
        alignOffset={-8}
      >
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <Input
              aria-label="Minimum diameter in millimeters"
              className="w-36"
              onChange={(event) =>
                setRange((currentRange) => ({
                  ...currentRange,
                  minDiameter: event.target.value,
                }))
              }
              placeholder="Min diameter (mm)"
              step="0.01"
              type="number"
              value={range.minDiameter}
            />
            <Input
              aria-label="Maximum diameter in millimeters"
              className="w-36"
              onChange={(event) =>
                setRange((currentRange) => ({
                  ...currentRange,
                  maxDiameter: event.target.value,
                }))
              }
              placeholder="Max diameter (mm)"
              step="0.01"
              type="number"
              value={range.maxDiameter}
            />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" variant="outline" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CustomThicknessRangeInput({
  values,
  onChange,
  autoFocus,
}: CustomRendererProps) {
  const selectedRange = getThicknessRangeValue(values[0])
  const [range, setRange] = useState({
    minThickness: selectedRange.minThickness?.toString() ?? "",
    maxThickness: selectedRange.maxThickness?.toString() ?? "",
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => setIsOpen(true), 400)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  const handleApply = () => {
    onChange([
      {
        minThickness: range.minThickness,
        maxThickness: range.maxThickness,
      },
    ])
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  const displayValue =
    range.minThickness || range.maxThickness
      ? `${range.minThickness || "any"} - ${range.maxThickness || "any"} mm`
      : "Set range"

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={<span />}>{displayValue}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-4"
        align="start"
        sideOffset={8}
        alignOffset={-8}
      >
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <Input
              aria-label="Minimum thickness in millimeters"
              className="w-36"
              onChange={(event) =>
                setRange((currentRange) => ({
                  ...currentRange,
                  minThickness: event.target.value,
                }))
              }
              placeholder="Min thickness (mm)"
              step="0.01"
              type="number"
              value={range.minThickness}
            />
            <Input
              aria-label="Maximum thickness in millimeters"
              className="w-36"
              onChange={(event) =>
                setRange((currentRange) => ({
                  ...currentRange,
                  maxThickness: event.target.value,
                }))
              }
              placeholder="Max thickness (mm)"
              step="0.01"
              type="number"
              value={range.maxThickness}
            />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" variant="outline" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

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
    rimCode: string | undefined
    rulerCode: string | undefined
    shapeCode: string | undefined
    techniqueCode: string | undefined
    themeCode: string | undefined
    toYear: number | undefined
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
  selectedRimCode,
  selectedRulerCode,
  selectedShapeCode,
  selectedTechniqueCode,
  selectedThemeCode,
  selectedToYear,
  onFiltersChange,
}: HomeFiltersProps) {
  const [lastAddedValues, setLastAddedValues] = useState<unknown[] | null>(null)
  const [isFaceValueFilterPending, setIsFaceValueFilterPending] =
    useState(false)
  const [isWeightFilterPending, setIsWeightFilterPending] = useState(false)
  const [isDiameterFilterPending, setIsDiameterFilterPending] = useState(false)
  const [isThicknessFilterPending, setIsThicknessFilterPending] =
    useState(false)

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
    isFaceValueFilterPending
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
    isWeightFilterPending
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
    isDiameterFilterPending
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
    isThicknessFilterPending
      ? [
          createFilter("thickness", "between", [
            {
              minThickness: selectedMinThickness,
              maxThickness: selectedMaxThickness,
            },
          ]),
        ]
      : []),
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

  async function handleFiltersChange(nextFilters: Filter[]) {
    const addedFilter = nextFilters.find(
      (nextFilter) => !filters.some((filter) => filter.id === nextFilter.id)
    )

    if (addedFilter) {
      setLastAddedValues(addedFilter.values)
    }

    setIsFaceValueFilterPending(
      nextFilters.some((filter) => filter.field === "faceValue")
    )
    setIsWeightFilterPending(
      nextFilters.some((filter) => filter.field === "weight")
    )
    setIsDiameterFilterPending(
      nextFilters.some((filter) => filter.field === "diameter")
    )
    setIsThicknessFilterPending(
      nextFilters.some((filter) => filter.field === "thickness")
    )

    const issuerYearFilter = nextFilters.find(
      (filter) => filter.field === "issuerYear"
    )
    const issuerYearRange = issuerYearFilter
      ? getIssueYearRangeValue(issuerYearFilter.values[0])
      : undefined
    const faceValueFilter = nextFilters.find(
      (filter) => filter.field === "faceValue"
    )
    const faceValueRange = faceValueFilter
      ? getFaceValueRangeValue(faceValueFilter.values[0])
      : undefined
    const weightFilter = nextFilters.find((filter) => filter.field === "weight")
    const weightRange = weightFilter
      ? getWeightRangeValue(weightFilter.values[0])
      : undefined
    const diameterFilter = nextFilters.find(
      (filter) => filter.field === "diameter"
    )
    const diameterRange = diameterFilter
      ? getDiameterRangeValue(diameterFilter.values[0])
      : undefined
    const thicknessFilter = nextFilters.find(
      (filter) => filter.field === "thickness"
    )
    const thicknessRange = thicknessFilter
      ? getThicknessRangeValue(thicknessFilter.values[0])
      : undefined
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
      fromYear: issuerYearRange?.min,
      issuerCode:
        typeof issuerCode === "string" && issuerCode.length > 0
          ? issuerCode
          : undefined,
      maxDiameter: diameterRange?.maxDiameter,
      maxThickness: thicknessRange?.maxThickness,
      maxValue: faceValueRange?.maxValue,
      maxWeight: weightRange?.maxWeight,
      minDiameter: diameterRange?.minDiameter,
      minThickness: thicknessRange?.minThickness,
      minValue: faceValueRange?.minValue,
      minWeight: weightRange?.minWeight,
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
      toYear: issuerYearRange?.max,
      rulerCode:
        typeof rulerCode === "string" && rulerCode.length > 0
          ? rulerCode
          : undefined,
    })
  }

  async function clearFilters() {
    setIsFaceValueFilterPending(false)
    setIsWeightFilterPending(false)
    setIsDiameterFilterPending(false)
    setIsThicknessFilterPending(false)

    await onFiltersChange({
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
      rimCode: undefined,
      rulerCode: undefined,
      shapeCode: undefined,
      techniqueCode: undefined,
      themeCode: undefined,
      toYear: undefined,
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
