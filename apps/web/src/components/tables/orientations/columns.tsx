import type { ColumnDef } from "@tanstack/react-table"
import type { OrientationOption } from "@workspace/db"

export const orientationColumns: ColumnDef<OrientationOption>[] = [
  {
    accessorKey: "code",
    header: "Orientation Code",
  },
  {
    accessorKey: "name",
    header: "Orientation Name",
  },
]
