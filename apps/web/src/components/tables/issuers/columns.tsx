import type { ColumnDef } from "@tanstack/react-table"
import type { IssuerMaintenanceRecord } from "@workspace/db"

const NO_PARENT_ISSUER_LABEL = "No Parent Issuer"

export const issuerColumns: ColumnDef<IssuerMaintenanceRecord>[] = [
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
        return NO_PARENT_ISSUER_LABEL
      }

      return `${parent.name} (${parent.code})`
    },
  },
]
