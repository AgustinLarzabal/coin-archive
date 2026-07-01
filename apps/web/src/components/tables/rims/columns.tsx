import type { ColumnDef } from "@tanstack/react-table"
import type { RimOption } from "@workspace/db"

export const rimColumns: ColumnDef<RimOption>[] = [
  {
    accessorKey: "code",
    header: "Rim Code",
  },
  {
    accessorKey: "name",
    header: "Rim Name",
  },
]
