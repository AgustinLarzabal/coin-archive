import type { IssuerOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { createFilter, Filters } from "@workspace/ui/components/reui/filters"
import type { Filter, FilterFieldConfig } from "@workspace/ui/components/reui/filters"
import { FunnelX, Globe, ListFilter } from "lucide-react"
import { z } from "zod"

type HomeFiltersProps = {
  issuers: IssuerOption[]
  selectedIssuerCode?: string
  onFiltersChange: (filters: {
    issuerCode: string | undefined
  }) => Promise<void>
}

const issuerFilterValueSchema = z.string().trim().min(1)

function toOptionalIssuerCode(value: unknown) {
  const parsedValue = issuerFilterValueSchema.safeParse(value)

  return parsedValue.success ? parsedValue.data : undefined
}

function getSingleFilterValue(filters: Filter[], field: Filter["field"]) {
  return filters.find((filter) => filter.field === field)?.values[0]
}

export function HomeFilters({
  issuers,
  selectedIssuerCode,
  onFiltersChange,
}: HomeFiltersProps) {
  const fields: FilterFieldConfig[] = [
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
      ],
    },
  ]

  const filters: Filter[] = selectedIssuerCode
    ? [createFilter("issuer", "is", [selectedIssuerCode])]
    : []

  async function handleFiltersChange(nextFilters: Filter[]) {
    const issuerCode = getSingleFilterValue(nextFilters, "issuer")

    await onFiltersChange({
      issuerCode: toOptionalIssuerCode(issuerCode),
    })
  }

  async function clearFilters() {
    await onFiltersChange({
      issuerCode: undefined,
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
    </div>
  )
}
