import type { ThemeOption } from "@workspace/db"
import type { ColumnDef } from "@tanstack/react-table"

export const themeColumns: ColumnDef<ThemeOption>[] = [
  {
    accessorKey: "code",
    header: "Theme Code",
  },
  {
    accessorKey: "name",
    header: "Theme Name",
  },
]
