import type { ColumnDef } from "@tanstack/react-table"
import type { DistributionOption } from "@workspace/db"

export const distributionColumns: ColumnDef<DistributionOption>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
]
