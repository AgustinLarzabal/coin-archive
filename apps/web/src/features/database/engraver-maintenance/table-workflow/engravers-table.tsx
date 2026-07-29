import { useState } from "react"
import type { EngraverOption } from "@coin-archive/db"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createEngraverColumns } from "./columns"
import { EngraverMaintenanceSheet } from "../sheet-workflow/engraver-maintenance-sheet"
import { EngraversTableToolbar } from "./engravers-table-toolbar"

type EngraversTableProps = {
  engravers: EngraverOption[]
}

export function EngraversTable({ engravers }: EngraversTableProps) {
  const [selectedEngraver, setSelectedEngraver] =
    useState<EngraverOption | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [shouldOpenDeleteDialog, setShouldOpenDeleteDialog] = useState(false)

  function openMaintenanceSheet(
    engraver: EngraverOption | null,
    options?: { deleteDialogOpen?: boolean }
  ) {
    setSelectedEngraver(engraver)
    setShouldOpenDeleteDialog(options?.deleteDialogOpen ?? false)
    setIsMaintenanceSheetOpen(true)
  }

  function openCreateEngraverSheet() {
    openMaintenanceSheet(null)
  }

  function openEditEngraverSheet(engraver: EngraverOption) {
    openMaintenanceSheet(engraver)
  }

  function openDeleteEngraverSheet(engraver: EngraverOption) {
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
