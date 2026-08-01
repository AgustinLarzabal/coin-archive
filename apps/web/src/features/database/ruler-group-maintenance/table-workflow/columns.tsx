import type { ColumnDef } from "@tanstack/react-table"
import type { RulerGroupOption } from "@coin-archive/db"
import { Button } from "@coin-archive/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coin-archive/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

import { SortableColumnHeader } from "../../sortable-column-header"

export function createRulerGroupColumns(
  openEditRulerGroupSheet: (rulerGroup: RulerGroupOption) => void
): ColumnDef<RulerGroupOption>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>
          Ruler Group Code
        </SortableColumnHeader>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>
          Ruler Group Name
        </SortableColumnHeader>
      ),
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
              <DropdownMenuItem
                onClick={() => openEditRulerGroupSheet(rulerGroup)}
              >
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
