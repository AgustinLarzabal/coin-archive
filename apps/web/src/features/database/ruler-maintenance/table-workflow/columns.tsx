import type { ColumnDef } from "@tanstack/react-table"
import type { RulerOption } from "@coin-archive/db"
import { Button } from "@coin-archive/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coin-archive/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

import { buildRulerGroupOptionLabel } from "../form-workflow/ruler-form.shared"
import { SortableColumnHeader } from "../../sortable-column-header"

export function createRulerColumns(
  openEditRulerSheet: (ruler: RulerOption) => void
): ColumnDef<RulerOption>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>Ruler Code</SortableColumnHeader>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>Ruler Name</SortableColumnHeader>
      ),
    },
    {
      id: "group",
      accessorFn: (ruler) =>
        ruler.group
          ? buildRulerGroupOptionLabel(ruler.group)
          : "No Ruler Group",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>Ruler Group</SortableColumnHeader>
      ),
      cell: ({ row }) => {
        const group = row.original.group

        if (!group) {
          return <span className="text-muted-foreground">No Ruler Group</span>
        }

        return buildRulerGroupOptionLabel(group)
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const ruler = row.original

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
              <DropdownMenuItem onClick={() => openEditRulerSheet(ruler)}>
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
