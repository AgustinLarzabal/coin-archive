import type { ColumnDef } from "@tanstack/react-table"
import type { ShapeOption } from "@workspace/db"

export const shapeColumns: ColumnDef<ShapeOption>[] = [
  {
    accessorKey: "code",
    header: "Shape Code",
  },
  {
    accessorKey: "name",
    header: "Shape Name",
  },
]
