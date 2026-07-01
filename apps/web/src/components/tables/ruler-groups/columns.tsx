import type { ColumnDef } from "@tanstack/react-table"
import type { RulerGroupOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

export function createRulerGroupColumns(
  openEditRulerGroupSheet: (rulerGroup: RulerGroupOption) => void
): ColumnDef<RulerGroupOption>[] {
  return [
    {
      accessorKey: "code",
      header: "Ruler Group Code",
    },
    {
      accessorKey: "name",
      header: "Ruler Group Name",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const rulerGroup = row.original

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
                  onClick={() => openEditRulerGroupSheet(rulerGroup)}
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
