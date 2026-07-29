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
