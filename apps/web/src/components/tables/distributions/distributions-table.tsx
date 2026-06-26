import { useState } from "react"
import type { DistributionOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createDistributionColumns } from "./columns"
import { DistributionMaintenanceSheet } from "./distribution-maintenance-sheet"
import { DistributionsTableToolbar } from "./distributions-table-toolbar"

type DistributionsTableProps = {
  distributions: DistributionOption[]
}

export function DistributionsTable({
  distributions,
}: DistributionsTableProps) {
  const [selectedDistribution, setSelectedDistribution] =
    useState<DistributionOption | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)

  function openCreateDistributionSheet() {
    setSelectedDistribution(null)
    setIsMaintenanceSheetOpen(true)
  }

  function openEditDistributionSheet(distribution: DistributionOption) {
    setSelectedDistribution(distribution)
    setIsMaintenanceSheetOpen(true)
  }

  const columns = createDistributionColumns(openEditDistributionSheet)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedDistribution(null)
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={distributions}
        toolbar={() => (
          <DistributionsTableToolbar
            onCreateDistribution={openCreateDistributionSheet}
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
