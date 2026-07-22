import { useState } from "react"
import type { RulerGroupOption, RulerOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createRulerColumns } from "./columns"
import { RulerMaintenanceSheet } from "../sheet-workflow/ruler-maintenance-sheet"
import { RulersTableToolbar } from "./rulers-table-toolbar"

type RulersTableProps = {
  rulers: RulerOption[]
  rulerGroups: RulerGroupOption[]
}

export function filterRulers(
  rulers: RulerOption[],
  filterValue: string
): RulerOption[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return rulers
  }

  return rulers.filter(({ code, name, group }) => {
    const groupCode = group?.code.toLocaleLowerCase() ?? ""
    const groupName = group?.name.toLocaleLowerCase() ?? ""

    return (
      code.toLocaleLowerCase().includes(normalizedFilterValue) ||
      name.toLocaleLowerCase().includes(normalizedFilterValue) ||
      groupCode.includes(normalizedFilterValue) ||
      groupName.includes(normalizedFilterValue)
    )
  })
}

export function RulersTable({ rulers, rulerGroups }: RulersTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const [selectedRuler, setSelectedRuler] = useState<RulerOption | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const filteredRulers = filterRulers(rulers, filterValue)

  function openMaintenanceSheet(ruler: RulerOption | null) {
    setSelectedRuler(ruler)
    setIsMaintenanceSheetOpen(true)
  }

  function openCreateRulerSheet() {
    openMaintenanceSheet(null)
  }

  function openEditRulerSheet(ruler: RulerOption) {
    openMaintenanceSheet(ruler)
  }

  return (
    <>
      <DataTable
        columns={createRulerColumns(openEditRulerSheet)}
        data={filteredRulers}
        toolbar={() => (
          <RulersTableToolbar
            filterValue={filterValue}
            onCreateRuler={openCreateRulerSheet}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <RulerMaintenanceSheet
        ruler={selectedRuler}
        rulerGroups={rulerGroups}
        open={isMaintenanceSheetOpen}
        onOpenChange={setIsMaintenanceSheetOpen}
      />
    </>
  )
}
