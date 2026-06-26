import type { ColumnDef } from "@tanstack/react-table"
import type { DistributionOption } from "@workspace/db"

export function createDistributionColumns(): ColumnDef<DistributionOption>[] {
  return [
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
  ]
}
