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
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const columns = useMemo(() => createDistributionColumns(), [])

  return (
    <>
      <DataTable
        columns={columns}
        data={distributions}
        toolbar={() => (
          <DistributionsTableToolbar
            onCreateDistribution={() => setIsMaintenanceSheetOpen(true)}
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
