import { useState } from "react"
import type { Distribution } from "@coin-archive/api"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createDistributionColumns } from "./columns"
import { DistributionMaintenanceSheet } from "../sheet-workflow/distribution-maintenance-sheet"
import { DistributionsTableToolbar } from "./distributions-table-toolbar"

type DistributionsTableProps = {
  distributions: Distribution[]
}

export function DistributionsTable({ distributions }: DistributionsTableProps) {
  const [selectedDistribution, setSelectedDistribution] =
    useState<Distribution | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)

  function openCreateDistributionSheet() {
    setSelectedDistribution(null)
    setIsMaintenanceSheetOpen(true)
  }

  function openEditDistributionSheet(distribution: Distribution) {
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
