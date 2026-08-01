import type { ColumnDef } from "@tanstack/react-table"
import type { EngraverOption } from "@coin-archive/db"
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

export function createEngraverColumns(
  onEditEngraver: (engraver: EngraverOption) => void,
  onDeleteEngraver: (engraver: EngraverOption) => void
): ColumnDef<EngraverOption>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>
          Engraver Name
        </SortableColumnHeader>
      ),
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>
          Engraver Code
        </SortableColumnHeader>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const engraver = row.original

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
                <DropdownMenuItem onClick={() => onEditEngraver(engraver)}>
                  Edit Engraver
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteEngraver(engraver)}
                >
                  Delete Engraver
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
