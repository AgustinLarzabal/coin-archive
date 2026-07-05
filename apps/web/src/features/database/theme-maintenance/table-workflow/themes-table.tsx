import { useState } from "react"
import type { ThemeOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createThemeColumns } from "./columns"
import { ThemeMaintenanceSheet } from "../sheet-workflow/theme-maintenance-sheet"
import { ThemesTableToolbar } from "./themes-table-toolbar"

type ThemesTableProps = {
  initialSuccessMessage?: string | null
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

export function ThemesTable({
  themes,
  initialSuccessMessage = null,
}: ThemesTableProps) {
  const [filterValue, setFilterValue] = useState("")
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialSuccessMessage
  )
  const filteredThemes = filterThemes(themes, filterValue)

  function openThemeMaintenanceSheet(theme: ThemeOption | null) {
    setSuccessMessage(null)
    setSelectedTheme(theme)
    setIsMaintenanceSheetOpen(true)
  }

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)
  }

  return (
    <>
      {successMessage ? (
        <p role="status" className="mb-4 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}
      <DataTable
        columns={createThemeColumns(openThemeMaintenanceSheet)}
        data={filteredThemes}
        toolbar={() => (
          <ThemesTableToolbar
            filterValue={filterValue}
            onCreateTheme={() => openThemeMaintenanceSheet(null)}
            onFilterValueChange={setFilterValue}
          />
        )}
      />
      <ThemeMaintenanceSheet
        theme={selectedTheme}
        open={isMaintenanceSheetOpen}
        onCompleted={setSuccessMessage}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
