import { useMemo, useState } from "react"
import type { Mint } from "@coin-archive/api"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createMintColumns } from "./columns"
import { MintMaintenanceSheet } from "../sheet-workflow/mint-maintenance-sheet"
import { MintsTableToolbar } from "./mints-table-toolbar"

type MintsTableProps = {
  mints: Mint[]
}

export function filterMints(mints: Mint[], filterValue: string): Mint[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return mints
  }

  return mints.filter((mint) =>
    [mint.code, mint.name].some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

export function MintsTable({ mints }: MintsTableProps) {
  const [selectedMint, setSelectedMint] = useState<Mint | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [filterValue, setFilterValue] = useState("")
  const columns = useMemo(
    () =>
      createMintColumns((mint) => {
        setSelectedMint(mint)
        setIsMaintenanceSheetOpen(true)
      }),
    []
  )
  const filteredMints = filterMints(mints, filterValue)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedMint(null)
    }
  }

  function handleCreateMint() {
    setSelectedMint(null)
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredMints}
        toolbar={() => (
          <MintsTableToolbar
            filterValue={filterValue}
            onCreateMint={handleCreateMint}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <MintMaintenanceSheet
        mint={selectedMint}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
