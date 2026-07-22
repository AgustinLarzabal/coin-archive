import type { ColumnDef } from "@tanstack/react-table"
import type { EngraverOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

export function createEngraverColumns(
  onEditEngraver: (engraver: EngraverOption) => void,
  onDeleteEngraver: (engraver: EngraverOption) => void
): ColumnDef<EngraverOption>[] {
  return [
    {
      accessorKey: "name",
      header: "Engraver Name",
    },
    {
      accessorKey: "code",
      header: "Engraver Code",
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
