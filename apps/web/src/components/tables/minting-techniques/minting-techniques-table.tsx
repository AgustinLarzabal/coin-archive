import { useState } from "react"
import type { TechniqueOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { mintingTechniqueColumns } from "./columns"
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

  return mintingTechniques.filter(({ code, name }) => {
    return (
      code.toLocaleLowerCase().includes(normalizedFilterValue) ||
      name.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  })
}

export function MintingTechniquesTable({
  mintingTechniques,
}: MintingTechniquesTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const filteredMintingTechniques = filterMintingTechniques(
    mintingTechniques,
    filterValue
  )

  return (
    <DataTable
      columns={mintingTechniqueColumns}
      data={filteredMintingTechniques}
      toolbar={() => (
        <MintingTechniquesTableToolbar
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
        />
      )}
    />
  )
}
