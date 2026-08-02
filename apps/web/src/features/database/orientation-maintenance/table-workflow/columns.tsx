import type { ColumnDef } from "@tanstack/react-table"
import type { Orientation as OrientationOption } from "@coin-archive/api"
import { Button } from "@coin-archive/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coin-archive/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

import { SortableColumnHeader } from "../../sortable-column-header"

export function createOrientationColumns(
  onEditOrientation: (orientation: OrientationOption) => void
): ColumnDef<OrientationOption>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>
          Orientation Code
        </SortableColumnHeader>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>
          Orientation Name
        </SortableColumnHeader>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const orientation = row.original

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
                <DropdownMenuItem
                  onClick={() => onEditOrientation(orientation)}
                >
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
