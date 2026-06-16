import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Slider } from "@workspace/ui/components/slider"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import type { PositiveNumberFilterValue } from "../lib/coin-search"

export const issueYearBounds = {
  min: -1000,
  max: new Date().getUTCFullYear(),
} as const

export type CustomRendererProps = {
  values: unknown[]
  onChange: (values: unknown[]) => void
  autoFocus?: boolean
}

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

type RangeTextFieldProps = {
  ariaLabel: string
  name: string
  placeholder: string
  step: string
  value: string
  onChange: (value: string) => void
}

const faceValueRangeInputFields = [
  {
    name: "minValue",
    ariaLabel: "Minimum face value in major units",
    placeholder: "Min face value",
    step: "0.000001",
  },
  {
    name: "maxValue",
    ariaLabel: "Maximum face value in major units",
    placeholder: "Max face value",
    step: "0.000001",
  },
] as const satisfies readonly Omit<RangeTextFieldProps, "value" | "onChange">[]

const weightRangeInputFields = [
  {
    name: "minWeight",
    ariaLabel: "Minimum weight in grams",
    placeholder: "Min weight (g)",
    step: "0.01",
  },
  {
    name: "maxWeight",
    ariaLabel: "Maximum weight in grams",
    placeholder: "Max weight (g)",
    step: "0.01",
  },
] as const satisfies readonly Omit<RangeTextFieldProps, "value" | "onChange">[]

const diameterRangeInputFields = [
  {
    name: "minDiameter",
    ariaLabel: "Minimum diameter in millimeters",
    placeholder: "Min diameter (mm)",
    step: "0.01",
  },
  {
    name: "maxDiameter",
    ariaLabel: "Maximum diameter in millimeters",
    placeholder: "Max diameter (mm)",
    step: "0.01",
  },
] as const satisfies readonly Omit<RangeTextFieldProps, "value" | "onChange">[]

const thicknessRangeInputFields = [
  {
    name: "minThickness",
    ariaLabel: "Minimum thickness in millimeters",
    placeholder: "Min thickness (mm)",
    step: "0.01",
  },
  {
    name: "maxThickness",
    ariaLabel: "Maximum thickness in millimeters",
    placeholder: "Max thickness (mm)",
    step: "0.01",
  },
] as const satisfies readonly Omit<RangeTextFieldProps, "value" | "onChange">[]

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

export function getIssueYearRangeValue(value: unknown) {
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

export function getFaceValueRangeValue(value: unknown): FaceValueRangeValue {
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

export function getWeightRangeValue(value: unknown): WeightRangeValue {
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

export function getDiameterRangeValue(value: unknown): DiameterRangeValue {
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

export function getThicknessRangeValue(value: unknown): ThicknessRangeValue {
  if (isThicknessRangeValue(value)) {
    return value
  }

  return {
    minThickness: undefined,
    maxThickness: undefined,
  }
}

function RangePopover({
  autoFocus,
  displayValue,
  onApply,
  children,
}: {
  autoFocus?: boolean
  displayValue: string
  onApply: () => void
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!autoFocus) {
      return
    }

    const timer = setTimeout(() => setIsOpen(true), 400)
    return () => clearTimeout(timer)
  }, [autoFocus])

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
          {children}
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onApply()
                setIsOpen(false)
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function RangeTextFields({
  fields,
  values,
  onValueChange,
}: {
  fields: readonly Omit<RangeTextFieldProps, "value" | "onChange">[]
  values: Record<string, string>
  onValueChange: (name: string, value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {fields.map(({ ariaLabel, name, placeholder, step }) => (
        <Input
          aria-label={ariaLabel}
          className="w-36"
          key={name}
          onChange={(event) => onValueChange(name, event.target.value)}
          placeholder={placeholder}
          step={step}
          type="number"
          value={values[name]}
        />
      ))}
    </div>
  )
}

function buildRangeDisplayValue(
  minValue: string,
  maxValue: string,
  unit?: string
) {
  if (!minValue && !maxValue) {
    return "Set range"
  }

  const suffix = unit ? ` ${unit}` : ""
  return `${minValue || "any"} - ${maxValue || "any"}${suffix}`
}

export function CustomSliderRangeInput({
  values,
  onChange,
  autoFocus,
}: CustomRendererProps) {
  const [range, setRange] = useState<number[]>(() => {
    const selectedRange = getIssueYearRangeValue(values[0])
    return [selectedRange.min, selectedRange.max]
  })

  return (
    <RangePopover
      autoFocus={autoFocus}
      displayValue={`${range[0]} - ${range[1]}`}
      onApply={() => onChange([{ min: range[0], max: range[1] }])}
    >
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
    </RangePopover>
  )
}

export function CustomFaceValueRangeInput({
  values,
  onChange,
  autoFocus,
}: CustomRendererProps) {
  const selectedRange = getFaceValueRangeValue(values[0])
  const [range, setRange] = useState({
    minValue: selectedRange.minValue?.toString() ?? "",
    maxValue: selectedRange.maxValue?.toString() ?? "",
  })

  return (
    <RangePopover
      autoFocus={autoFocus}
      displayValue={buildRangeDisplayValue(range.minValue, range.maxValue)}
      onApply={() => onChange([range])}
    >
      <RangeTextFields
        fields={faceValueRangeInputFields}
        values={range}
        onValueChange={(name, value) =>
          setRange((currentRange) => ({
            ...currentRange,
            [name]: value,
          }))
        }
      />
    </RangePopover>
  )
}

export function CustomWeightRangeInput({
  values,
  onChange,
  autoFocus,
}: CustomRendererProps) {
  const selectedRange = getWeightRangeValue(values[0])
  const [range, setRange] = useState({
    minWeight: selectedRange.minWeight?.toString() ?? "",
    maxWeight: selectedRange.maxWeight?.toString() ?? "",
  })

  return (
    <RangePopover
      autoFocus={autoFocus}
      displayValue={buildRangeDisplayValue(
        range.minWeight,
        range.maxWeight,
        "g"
      )}
      onApply={() => onChange([range])}
    >
      <RangeTextFields
        fields={weightRangeInputFields}
        values={range}
        onValueChange={(name, value) =>
          setRange((currentRange) => ({
            ...currentRange,
            [name]: value,
          }))
        }
      />
    </RangePopover>
  )
}

export function CustomDiameterRangeInput({
  values,
  onChange,
  autoFocus,
}: CustomRendererProps) {
  const selectedRange = getDiameterRangeValue(values[0])
  const [range, setRange] = useState({
    minDiameter: selectedRange.minDiameter?.toString() ?? "",
    maxDiameter: selectedRange.maxDiameter?.toString() ?? "",
  })

  return (
    <RangePopover
      autoFocus={autoFocus}
      displayValue={buildRangeDisplayValue(
        range.minDiameter,
        range.maxDiameter,
        "mm"
      )}
      onApply={() => onChange([range])}
    >
      <RangeTextFields
        fields={diameterRangeInputFields}
        values={range}
        onValueChange={(name, value) =>
          setRange((currentRange) => ({
            ...currentRange,
            [name]: value,
          }))
        }
      />
    </RangePopover>
  )
}

export function CustomThicknessRangeInput({
  values,
  onChange,
  autoFocus,
}: CustomRendererProps) {
  const selectedRange = getThicknessRangeValue(values[0])
  const [range, setRange] = useState({
    minThickness: selectedRange.minThickness?.toString() ?? "",
    maxThickness: selectedRange.maxThickness?.toString() ?? "",
  })

  return (
    <RangePopover
      autoFocus={autoFocus}
      displayValue={buildRangeDisplayValue(
        range.minThickness,
        range.maxThickness,
        "mm"
      )}
      onApply={() => onChange([range])}
    >
      <RangeTextFields
        fields={thicknessRangeInputFields}
        values={range}
        onValueChange={(name, value) =>
          setRange((currentRange) => ({
            ...currentRange,
            [name]: value,
          }))
        }
      />
    </RangePopover>
  )
}
