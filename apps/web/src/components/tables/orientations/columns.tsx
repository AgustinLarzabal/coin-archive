import type { ColumnDef } from "@tanstack/react-table"
import type { OrientationOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

export function createOrientationColumns(
  onEditOrientation: (orientation: OrientationOption) => void
): ColumnDef<OrientationOption>[] {
  return [
    {
      accessorKey: "code",
      header: "Orientation Code",
    },
    {
      accessorKey: "name",
      header: "Orientation Name",
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
                <DropdownMenuItem onClick={() => onEditOrientation(orientation)}>
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
