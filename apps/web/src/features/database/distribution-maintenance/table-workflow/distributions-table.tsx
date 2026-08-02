import { useMemo, useState } from "react"
import type { Distribution } from "@coin-archive/api"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createDistributionColumns } from "./columns"
import { DistributionsTableToolbar } from "./distributions-table-toolbar"
import { DistributionMaintenanceSheet } from "../sheet-workflow/distribution-maintenance-sheet"

type DistributionsTableProps = {
  distributions: Distribution[]
}

export function filterDistributionsByName(
  distributions: Distribution[],
  nameFilter: string
): Distribution[] {
  const normalizedNameFilter = nameFilter.trim().toLocaleLowerCase()

  if (normalizedNameFilter === "") {
    return distributions
  }

  return distributions.filter((distribution) =>
    distribution.name.toLocaleLowerCase().includes(normalizedNameFilter)
  )
}

export function DistributionsTable({ distributions }: DistributionsTableProps) {
  const [selectedDistribution, setSelectedDistribution] =
    useState<Distribution | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [nameFilter, setNameFilter] = useState("")
  const columns = useMemo(
    () =>
      createDistributionColumns((distribution) => {
        setSelectedDistribution(distribution)
        setIsMaintenanceSheetOpen(true)
      }),
    []
  )
  const filteredDistributions = filterDistributionsByName(
    distributions,
    nameFilter
  )

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedDistribution(null)
    }
  }

  function handleCreateDistribution() {
    setSelectedDistribution(null)
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredDistributions}
        toolbar={() => (
          <DistributionsTableToolbar
            nameFilter={nameFilter}
            onCreateDistribution={handleCreateDistribution}
            onNameFilterChange={setNameFilter}
          />
        )}
      />
      <DistributionMaintenanceSheet
        distribution={selectedDistribution}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
