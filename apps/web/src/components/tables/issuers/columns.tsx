import type { ColumnDef } from "@tanstack/react-table"
import type { IssuerMaintenanceRecord } from "@workspace/db"

export function createIssuerColumns(): ColumnDef<IssuerMaintenanceRecord>[] {
  return [
    {
      accessorKey: "name",
      header: "Issuer Name",
    },
    {
      accessorKey: "code",
      header: "Issuer Code",
    },
    {
      accessorKey: "isoCode",
      header: "Issuer ISO Code",
    },
    {
      id: "parent",
      header: "Parent Issuer",
      cell: ({ row }) => {
        const parent = row.original.parent

        if (parent === null) {
          return "No Parent Issuer"
        }

        return `${parent.name} (${parent.code})`
      },
    },
  ]
}
