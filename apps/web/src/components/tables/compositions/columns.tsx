import type { ColumnDef } from "@tanstack/react-table"
import type { CompositionOption } from "@workspace/db"

export const compositionColumns: ColumnDef<CompositionOption>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-[32rem] whitespace-pre-wrap break-words">
        {row.original.description ?? ""}
      </div>
    ),
  },
]
