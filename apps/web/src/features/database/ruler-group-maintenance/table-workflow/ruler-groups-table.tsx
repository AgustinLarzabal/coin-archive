import { useMemo, useState } from "react"
import type { RulerGroup } from "@coin-archive/api"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createRulerGroupColumns } from "./columns"
import { RulerGroupMaintenanceSheet } from "../sheet-workflow/ruler-group-maintenance-sheet"
import { RulerGroupsTableToolbar } from "./ruler-groups-table-toolbar"

type RulerGroupsTableProps = {
  rulerGroups: RulerGroup[]
}

export function filterRulerGroups(
  rulerGroups: RulerGroup[],
  filterValue: string
): RulerGroup[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return rulerGroups
  }

  return rulerGroups.filter((rulerGroup) =>
    [rulerGroup.code, rulerGroup.name].some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

export function RulerGroupsTable({ rulerGroups }: RulerGroupsTableProps) {
  const [selectedRulerGroup, setSelectedRulerGroup] =
    useState<RulerGroup | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [filterValue, setFilterValue] = useState("")
  const columns = useMemo(
    () =>
      createRulerGroupColumns((rulerGroup) => {
        setSelectedRulerGroup(rulerGroup)
        setIsMaintenanceSheetOpen(true)
      }),
    []
  )
  const filteredRulerGroups = filterRulerGroups(rulerGroups, filterValue)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedRulerGroup(null)
    }
  }

  function handleCreateRulerGroup() {
    setSelectedRulerGroup(null)
    setIsMaintenanceSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredRulerGroups}
        toolbar={() => (
          <RulerGroupsTableToolbar
            filterValue={filterValue}
            onCreateRulerGroup={handleCreateRulerGroup}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <RulerGroupMaintenanceSheet
        rulerGroup={selectedRulerGroup}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
