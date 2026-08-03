import { useState } from "react"
import type { Theme } from "@coin-archive/api"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createThemeColumns } from "./columns"
import { ThemeMaintenanceSheet } from "../sheet-workflow/theme-maintenance-sheet"
import { ThemesTableToolbar } from "./themes-table-toolbar"

type ThemesTableProps = {
  initialSuccessMessage?: string | null
  themes: Theme[]
}

export function filterThemes(themes: Theme[], filterValue: string): Theme[] {
  const normalizedFilterValue = filterValue.trim().toLocaleLowerCase()
  if (normalizedFilterValue === "") return themes
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
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [isMaintenanceSheetOpen, setIsMaintenanceSheetOpen] = useState(false)
  const [shouldOpenDeleteDialog, setShouldOpenDeleteDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialSuccessMessage
  )
  const filteredThemes = filterThemes(themes, filterValue)

  function openMaintenanceSheet(
    theme: Theme | null,
    options?: { deleteDialogOpen?: boolean }
  ) {
    setSuccessMessage(null)
    setSelectedTheme(theme)
    setShouldOpenDeleteDialog(options?.deleteDialogOpen ?? false)
    setIsMaintenanceSheetOpen(true)
  }

  function openCreateThemeSheet() {
    openMaintenanceSheet(null)
  }

  function openEditThemeSheet(theme: Theme) {
    openMaintenanceSheet(theme)
  }

  function openDeleteThemeSheet(theme: Theme) {
    openMaintenanceSheet(theme, { deleteDialogOpen: true })
  }

  const columns = createThemeColumns(openEditThemeSheet, openDeleteThemeSheet)

  function handleMaintenanceSheetOpenChange(open: boolean) {
    setIsMaintenanceSheetOpen(open)

    if (!open) {
      setSelectedTheme(null)
      setShouldOpenDeleteDialog(false)
    }
  }

  return (
    <>
      {successMessage ? (
        <p role="status" className="mb-4 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}
      <DataTable
        columns={columns}
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
        initialDeleteDialogOpen={shouldOpenDeleteDialog}
        onCompleted={setSuccessMessage}
        onOpenChange={handleMaintenanceSheetOpenChange}
      />
    </>
  )
}
