import { useMemo, useState } from "react"
import type { MintingTechnique } from "@coin-archive/api"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createMintingTechniqueColumns } from "./columns"
import { MintingTechniqueMaintenanceSheet } from "../sheet-workflow/minting-technique-maintenance-sheet"
import { MintingTechniquesTableToolbar } from "./minting-techniques-table-toolbar"

type MintingTechniquesTableProps = {
  mintingTechniques: MintingTechnique[]
}

export function filterMintingTechniques(
  mintingTechniques: MintingTechnique[],
  filterValue: string
): MintingTechnique[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return mintingTechniques
  }

  return mintingTechniques.filter((mintingTechnique) =>
    [mintingTechnique.code, mintingTechnique.name].some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

export function MintingTechniquesTable({
  mintingTechniques,
}: MintingTechniquesTableProps) {
  const [selectedMintingTechnique, setSelectedMintingTechnique] =
    useState<MintingTechnique | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [filterValue, setFilterValue] = useState("")
  const columns = useMemo(
    () =>
      createMintingTechniqueColumns((mintingTechnique) => {
        setSelectedMintingTechnique(mintingTechnique)
        setIsMaintenanceSheetOpen(true)
      }),
    []
  )
  const filteredMintingTechniques = filterMintingTechniques(
    mintingTechniques,
    filterValue
  )

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedMintingTechnique(null)
    }
  }

  function handleCreateMintingTechnique() {
    setSelectedMintingTechnique(null)
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredMintingTechniques}
        toolbar={() => (
          <MintingTechniquesTableToolbar
            filterValue={filterValue}
            onCreateMintingTechnique={handleCreateMintingTechnique}
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
