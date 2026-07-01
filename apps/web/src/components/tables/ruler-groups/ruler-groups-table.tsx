import { useState } from "react"
import type { RulerGroupOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createRulerGroupColumns } from "./columns"
import { RulerGroupMaintenanceSheet } from "./ruler-group-maintenance-sheet"
import { RulerGroupsTableToolbar } from "./ruler-groups-table-toolbar"

type RulerGroupsTableProps = {
  rulerGroups: RulerGroupOption[]
}

export function filterRulerGroups(
  rulerGroups: RulerGroupOption[],
  filterValue: string
): RulerGroupOption[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return rulerGroups
  }

  return rulerGroups.filter(
    ({ code, name }) =>
      code.toLocaleLowerCase().includes(normalizedFilterValue) ||
      name.toLocaleLowerCase().includes(normalizedFilterValue)
  )
}

export function RulerGroupsTable({ rulerGroups }: RulerGroupsTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const [selectedRulerGroup, setSelectedRulerGroup] =
    useState<RulerGroupOption | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const filteredRulerGroups = filterRulerGroups(rulerGroups, filterValue)

  function openMaintenanceSheet(rulerGroup: RulerGroupOption | null) {
    setSelectedRulerGroup(rulerGroup)
    setIsMaintenanceSheetOpen(true)
  }

  function openCreateRulerGroupSheet() {
    openMaintenanceSheet(null)
  }

  function openEditRulerGroupSheet(rulerGroup: RulerGroupOption) {
    openMaintenanceSheet(rulerGroup)
  }

  return (
    <>
      <DataTable
        columns={createRulerGroupColumns(openEditRulerGroupSheet)}
        data={filteredRulerGroups}
        toolbar={() => (
          <RulerGroupsTableToolbar
            filterValue={filterValue}
            onCreateRulerGroup={openCreateRulerGroupSheet}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <RulerGroupMaintenanceSheet
        rulerGroup={selectedRulerGroup}
        open={isMaintenanceSheetOpen}
        onOpenChange={setIsMaintenanceSheetOpen}
      />
    </>
  )
}
