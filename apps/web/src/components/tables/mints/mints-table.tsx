import { useState } from "react"
import type { MintOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { mintColumns } from "./columns"
import { MintsTableToolbar } from "./mints-table-toolbar"

type MintsTableProps = {
  mints: MintOption[]
}

export function filterMints(mints: MintOption[], filterValue: string): MintOption[] {
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
  const [filterValue, setFilterValue] = useState("")
  const filteredMints = filterMints(mints, filterValue)

  return (
    <DataTable
      columns={mintColumns}
      data={filteredMints}
      toolbar={() => (
        <MintsTableToolbar
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
        />
      )}
    />
  )
}
