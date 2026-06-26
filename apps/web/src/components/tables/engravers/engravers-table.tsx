import { useState } from "react"
import type { EngraverOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createEngraverColumns } from "./columns"
import { EngraverMaintenanceSheet } from "./engraver-maintenance-sheet"
import { EngraversTableToolbar } from "./engravers-table-toolbar"

type EngraversTableProps = {
  engravers: EngraverOption[]
}

export function EngraversTable({ engravers }: EngraversTableProps) {
  const [selectedEngraver, setSelectedEngraver] = useState<EngraverOption | null>(
    null
  )
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)

  function openCreateEngraverSheet() {
    setSelectedEngraver(null)
    setIsMaintenanceSheetOpen(true)
  }

  function openEditEngraverSheet(engraver: EngraverOption) {
    setSelectedEngraver(engraver)
    setIsMaintenanceSheetOpen(true)
  }

  const columns = createEngraverColumns(openEditEngraverSheet)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedEngraver(null)
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={engravers}
        toolbar={() => (
          <EngraversTableToolbar onCreateEngraver={openCreateEngraverSheet} />
        )}
      />
      <EngraverMaintenanceSheet
        engraver={selectedEngraver}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
