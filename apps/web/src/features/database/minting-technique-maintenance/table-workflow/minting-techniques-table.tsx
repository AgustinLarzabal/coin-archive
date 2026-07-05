import { useState } from "react"
import type { TechniqueOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createMintingTechniqueColumns } from "./columns"
import { MintingTechniqueMaintenanceSheet } from "../sheet-workflow/minting-technique-maintenance-sheet"
import { MintingTechniquesTableToolbar } from "./minting-techniques-table-toolbar"

type MintingTechniquesTableProps = {
  mintingTechniques: TechniqueOption[]
}

export function filterMintingTechniques(
  mintingTechniques: TechniqueOption[],
  filterValue: string
): TechniqueOption[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return mintingTechniques
  }

  return mintingTechniques.filter((mintingTechnique) =>
    getMintingTechniqueFilterValues(mintingTechnique).some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

function getMintingTechniqueFilterValues(
  mintingTechnique: TechniqueOption
): string[] {
  return [mintingTechnique.code, mintingTechnique.name]
}

export function MintingTechniquesTable({
  mintingTechniques,
}: MintingTechniquesTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const [selectedMintingTechnique, setSelectedMintingTechnique] =
    useState<TechniqueOption | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const columns = createMintingTechniqueColumns(openEditMintingTechniqueSheet)
  const filteredMintingTechniques = filterMintingTechniques(
    mintingTechniques,
    filterValue
  )

  function openMaintenanceSheet(mintingTechnique: TechniqueOption | null) {
    setSelectedMintingTechnique(mintingTechnique)
    setIsMaintenanceSheetOpen(true)
  }

  function openCreateMintingTechniqueSheet() {
    openMaintenanceSheet(null)
  }

  function openEditMintingTechniqueSheet(mintingTechnique: TechniqueOption) {
    openMaintenanceSheet(mintingTechnique)
  }

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedMintingTechnique(null)
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredMintingTechniques}
        toolbar={() => (
          <MintingTechniquesTableToolbar
            filterValue={filterValue}
            onCreateMintingTechnique={openCreateMintingTechniqueSheet}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <MintingTechniqueMaintenanceSheet
        mintingTechnique={selectedMintingTechnique}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
