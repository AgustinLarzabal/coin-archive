import { useMemo, useState } from "react"
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
  const columns = useMemo(
    () =>
      createDistributionColumns((distribution) => {
        setSelectedDistribution(distribution)
        setIsMaintenanceSheetOpen(true)
      }),
    []
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
        data={distributions}
        toolbar={() => (
          <DistributionsTableToolbar
            onCreateDistribution={handleCreateDistribution}
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
