import type { ColumnDef } from "@tanstack/react-table"
import type { TechniqueOption } from "@workspace/db"

export const mintingTechniqueColumns: ColumnDef<TechniqueOption>[] = [
  {
    accessorKey: "code",
    header: "Minting Technique Code",
  },
  {
    accessorKey: "name",
    header: "Minting Technique Name",
  },
]
