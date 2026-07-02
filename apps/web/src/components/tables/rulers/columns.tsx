import type { ColumnDef } from "@tanstack/react-table"
import type { RulerOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

import { formatRulerGroupOptionLabel } from "./ruler-form.shared"

export function createRulerColumns(
  openEditRulerSheet: (ruler: RulerOption) => void
): ColumnDef<RulerOption>[] {
  return [
    {
      accessorKey: "code",
      header: "Ruler Code",
    },
    {
      accessorKey: "name",
      header: "Ruler Name",
    },
    {
      id: "group",
      header: "Ruler Group",
      cell: ({ row }) => {
        const ruler = row.original

        if (ruler.group === null) {
          return <span className="text-muted-foreground">None</span>
        }

        return formatRulerGroupOptionLabel(ruler.group)
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
