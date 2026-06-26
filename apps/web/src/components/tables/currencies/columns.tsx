import type { ColumnDef } from "@tanstack/react-table"
import type { CurrencyOption } from "@workspace/db"

export const currencyColumns: ColumnDef<CurrencyOption>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "fullName",
    header: "Full Name",
  },
]
