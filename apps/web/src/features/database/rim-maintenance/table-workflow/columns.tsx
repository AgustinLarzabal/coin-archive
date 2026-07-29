import type { ColumnDef } from "@tanstack/react-table"
import type { RimOption } from "@coin-archive/db"
import { Button } from "@coin-archive/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coin-archive/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

export function createRimColumns(
  onEditRim: (rim: RimOption) => void
): ColumnDef<RimOption>[] {
  return [
    {
      accessorKey: "code",
      header: "Rim Code",
    },
    {
      accessorKey: "name",
      header: "Rim Name",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const rim = row.original

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
                <DropdownMenuItem onClick={() => onEditRim(rim)}>
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
