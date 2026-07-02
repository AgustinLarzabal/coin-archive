import { useState } from "react"
import type { ThemeOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createThemeColumns } from "./columns"
import { ThemeMaintenanceSheet } from "./theme-maintenance-sheet"
import { ThemesTableToolbar } from "./themes-table-toolbar"

type ThemesTableProps = {
  themes: ThemeOption[]
}

export function filterThemes(
  themes: ThemeOption[],
  filterValue: string
): ThemeOption[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()

  if (normalizedFilterValue === "") {
    return themes
  }

  return themes.filter((theme) =>
    [theme.code, theme.name].some((value) =>
      value.toLocaleLowerCase().includes(normalizedFilterValue)
    )
  )
}

export function ThemesTable({ themes }: ThemesTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const filteredThemes = filterThemes(themes, filterValue)

  function openMaintenanceSheet(theme: ThemeOption | null) {
    setSelectedTheme(theme)
    setIsMaintenanceSheetOpen(true)
  }

  function openCreateThemeSheet() {
    openMaintenanceSheet(null)
  }

  function openEditThemeSheet(theme: ThemeOption) {
    openMaintenanceSheet(theme)
  }

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)
  }

  return (
    <>
      <DataTable
        columns={createThemeColumns(openEditThemeSheet)}
        data={filteredThemes}
        toolbar={() => (
          <ThemesTableToolbar
            filterValue={filterValue}
            onCreateTheme={openCreateThemeSheet}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <ThemeMaintenanceSheet
        theme={selectedTheme}
        open={isMaintenanceSheetOpen}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
