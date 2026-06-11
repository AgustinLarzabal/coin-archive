import type { IssuerOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { createFilter, Filters } from "@workspace/ui/components/reui/filters"
import type {
  Filter,
  FilterFieldConfig,
} from "@workspace/ui/components/reui/filters"
import { FunnelX, Globe, ListFilter } from "lucide-react"

type HomeFiltersProps = {
  issuers: IssuerOption[]
  selectedIssuerCode?: string
  onIssuerChange: (issuerCode: string | undefined) => Promise<void>
}

export function HomeFilters({
  issuers,
  selectedIssuerCode,
  onIssuerChange,
}: HomeFiltersProps) {
  const fields: FilterFieldConfig<string>[] = [
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
                src={`https://flagcdn.com/ar.svg`}
                alt={issuer.name}
                className="size-4 rounded-full object-cover"
              />
            ),
          })),
        },
      ],
    },
  ]

  const filters: Filter<string>[] = selectedIssuerCode
    ? [createFilter("issuer", "is", [selectedIssuerCode])]
    : []

  async function handleFiltersChange(nextFilters: Filter<string>[]) {
    const issuerFilter = nextFilters.find((filter) => filter.field === "issuer")
    const issuerCode = issuerFilter?.values[0]

    await onIssuerChange(
      typeof issuerCode === "string" && issuerCode.length > 0
        ? issuerCode
        : undefined
    )
  }

  async function clearFilters() {
    await onIssuerChange(undefined)
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
