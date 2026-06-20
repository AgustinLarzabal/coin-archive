import type {
  DistributionOption,
  EngraverOption,
  IssuerOption,
  RulerOption,
  ThemeOption,
} from "@workspace/db"
import { createFilter } from "@workspace/ui/components/reui/filters"
import type {
  Filter,
  FilterFieldConfig,
} from "@workspace/ui/components/reui/filters"
import { Coins, Crown, Globe, Map, PenTool } from "lucide-react"
import { z } from "zod"

export type HomeFilterValues = {
  distributionCode: string | undefined
  engraverCode: string | undefined
  issuerCode: string | undefined
  rulerCode: string | undefined
  themeCode: string | undefined
}

const filterValueSchema = z.string().trim().min(1)

function toOptionalString(value: unknown) {
  const parsedValue = filterValueSchema.safeParse(value)

  return parsedValue.success ? parsedValue.data : undefined
}

function getSingleFilterValue(filters: Filter[], field: Filter["field"]) {
  return filters.find((filter) => filter.field === field)?.values[0]
}

function createOptionalFilter(field: string, value: string | undefined) {
  return value ? [createFilter(field, "is", [value])] : []
}

export function getHomeFilterFields({
  distributions,
  engravers,
  issuers,
  rulers,
  themes,
}: {
  distributions: DistributionOption[]
  engravers: EngraverOption[]
  issuers: IssuerOption[]
  rulers: RulerOption[]
  themes: ThemeOption[]
}): FilterFieldConfig[] {
  return [
    {
      group: "Select",
      fields: [
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
            label: distribution.name,
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
            label: engraver.name,
          })),
        },
        {
          key: "ruler",
          label: "Ruling authority",
          icon: <Crown strokeWidth={2} />,
          type: "select",
          operators: [{ value: "is", label: "is" }],
          searchable: true,
          className: "w-[320px]",
          options: rulers.map((ruler) => ({
            value: ruler.code,
            label: ruler.name,
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
            label: theme.name,
          })),
        },
      ],
    },
  ]
}

export function getHomeFilters({
  selectedDistributionCode,
  selectedEngraverCode,
  selectedIssuerCode,
  selectedRulerCode,
  selectedThemeCode,
}: {
  selectedDistributionCode?: string
  selectedEngraverCode?: string
  selectedIssuerCode?: string
  selectedRulerCode?: string
  selectedThemeCode?: string
}): Filter[] {
  return [
    ...createOptionalFilter("distribution", selectedDistributionCode),
    ...createOptionalFilter("engraver", selectedEngraverCode),
    ...createOptionalFilter("issuer", selectedIssuerCode),
    ...createOptionalFilter("ruler", selectedRulerCode),
    ...createOptionalFilter("theme", selectedThemeCode),
  ]
}

export function getHomeFilterValues(filters: Filter[]): HomeFilterValues {
  const distributionCode = getSingleFilterValue(filters, "distribution")
  const engraverCode = getSingleFilterValue(filters, "engraver")
  const issuerCode = getSingleFilterValue(filters, "issuer")
  const rulerCode = getSingleFilterValue(filters, "ruler")
  const themeCode = getSingleFilterValue(filters, "theme")

  return {
    distributionCode: toOptionalString(distributionCode),
    engraverCode: toOptionalString(engraverCode),
    issuerCode: toOptionalString(issuerCode),
    rulerCode: toOptionalString(rulerCode),
    themeCode: toOptionalString(themeCode),
  }
}
