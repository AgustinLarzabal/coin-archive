import { useState } from "react"
import type { MintOption } from "@coin-archive/db"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createMintColumns } from "./columns"
import { MintMaintenanceSheet } from "../sheet-workflow/mint-maintenance-sheet"
import { MintsTableToolbar } from "./mints-table-toolbar"

type MintsTableProps = {
  mints: MintOption[]
}

export function filterMints(
  mints: MintOption[],
  filterValue: string
): MintOption[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return mints
  }

  return mints.filter((mint) =>
    getMintFilterValues(mint).some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

function getMintFilterValues(mint: MintOption): string[] {
  return [mint.code, mint.name]
}

export function MintsTable({ mints }: MintsTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const [selectedMint, setSelectedMint] = useState<MintOption | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [shouldOpenDeleteDialog, setShouldOpenDeleteDialog] = useState(false)

  function openMaintenanceSheet(
    mint: MintOption | null,
    options?: { deleteDialogOpen?: boolean }
  ) {
    setSelectedMint(mint)
    setShouldOpenDeleteDialog(options?.deleteDialogOpen ?? false)
    setIsMaintenanceSheetOpen(true)
  }

  function openCreateMintSheet() {
    openMaintenanceSheet(null)
  }

  function openEditMintSheet(mint: MintOption) {
    openMaintenanceSheet(mint)
  }

  function openDeleteMintSheet(mint: MintOption) {
    openMaintenanceSheet(mint, { deleteDialogOpen: true })
  }

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedMint(null)
      setShouldOpenDeleteDialog(false)
    }
  }

  const columns = createMintColumns(openEditMintSheet, openDeleteMintSheet)
  const filteredMints = filterMints(mints, filterValue)

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredMints}
        toolbar={() => (
          <MintsTableToolbar
            filterValue={filterValue}
            onFilterValueChange={setFilterValue}
            onCreateMint={openCreateMintSheet}
          />
        )}
      />
      <MintMaintenanceSheet
        mint={selectedMint}
        open={isMaintenanceSheetOpen}
        initialDeleteDialogOpen={shouldOpenDeleteDialog}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
