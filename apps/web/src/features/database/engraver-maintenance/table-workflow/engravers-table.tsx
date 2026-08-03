import { useState } from "react"
import type { Engraver } from "@coin-archive/api"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createEngraverColumns } from "./columns"
import { EngraverMaintenanceSheet } from "../sheet-workflow/engraver-maintenance-sheet"
import { EngraversTableToolbar } from "./engravers-table-toolbar"

type EngraversTableProps = {
  engravers: Engraver[]
}

export function EngraversTable({ engravers }: EngraversTableProps) {
  const [selectedEngraver, setSelectedEngraver] = useState<Engraver | null>(
    null
  )
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [shouldOpenDeleteDialog, setShouldOpenDeleteDialog] = useState(false)

  function openMaintenanceSheet(
    engraver: Engraver | null,
    options?: { deleteDialogOpen?: boolean }
  ) {
    setSelectedEngraver(engraver)
    setShouldOpenDeleteDialog(options?.deleteDialogOpen ?? false)
    setIsMaintenanceSheetOpen(true)
  }

  function openCreateEngraverSheet() {
    openMaintenanceSheet(null)
  }

  function openEditEngraverSheet(engraver: Engraver) {
    openMaintenanceSheet(engraver)
  }

  function openDeleteEngraverSheet(engraver: Engraver) {
    openMaintenanceSheet(engraver, { deleteDialogOpen: true })
  }

  const columns = createEngraverColumns(
    openEditEngraverSheet,
    openDeleteEngraverSheet
  )

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedEngraver(null)
      setShouldOpenDeleteDialog(false)
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
        initialDeleteDialogOpen={shouldOpenDeleteDialog}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
