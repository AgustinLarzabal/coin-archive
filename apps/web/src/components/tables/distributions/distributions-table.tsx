import { useState } from "react"
import type { DistributionOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { distributionColumns } from "./columns"
import { DistributionMaintenanceSheet } from "./distribution-maintenance-sheet"
import { DistributionsTableToolbar } from "./distributions-table-toolbar"

type DistributionsTableProps = {
  distributions: DistributionOption[]
}

export function DistributionsTable({
  distributions,
}: DistributionsTableProps) {
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)

  function handleCreateDistribution() {
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={distributionColumns}
        data={distributions}
        toolbar={() => (
          <DistributionsTableToolbar
            onCreateDistribution={handleCreateDistribution}
          />
        )}
      />
      <DistributionMaintenanceSheet
        open={isMaintenanceSheetOpen}
        onOpenChange={setIsMaintenanceSheetOpen}
      />
    </>
  )
}
