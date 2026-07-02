import { useState } from "react"
import type { ThemeOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { themeColumns } from "./columns"
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
  const filteredThemes = filterThemes(themes, filterValue)

  return (
    <DataTable
      columns={themeColumns}
      data={filteredThemes}
      toolbar={() => (
        <ThemesTableToolbar
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
        />
      )}
    />
  )
}
