import type { ColumnDef } from "@tanstack/react-table"
import type { ShapeOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

export function createShapeColumns(
  onEditShape: (shape: ShapeOption) => void
): ColumnDef<ShapeOption>[] {
  return [
    {
      accessorKey: "code",
      header: "Shape Code",
    },
    {
      accessorKey: "name",
      header: "Shape Name",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const shape = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon-sm" aria-label="Actions">
                  <Icons.More />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onEditShape(shape)}>
                  Edit
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
