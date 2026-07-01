import type { ColumnDef } from "@tanstack/react-table"
import type { MintOption } from "@workspace/db"

export const mintColumns: ColumnDef<MintOption>[] = [
  {
    accessorKey: "code",
    header: "Mint Code",
  },
  {
    accessorKey: "name",
    header: "Mint Name",
  },
]
