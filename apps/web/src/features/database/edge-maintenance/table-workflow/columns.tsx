import type { ColumnDef } from "@tanstack/react-table"
import type { EdgeOption } from "@coin-archive/db"
import { Button } from "@coin-archive/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coin-archive/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

export function createEdgeColumns(
  onEditEdge: (edge: EdgeOption) => void
): ColumnDef<EdgeOption>[] {
  return [
    {
      accessorKey: "code",
      header: "Edge Code",
    },
    {
      accessorKey: "name",
      header: "Edge Name",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const edge = row.original

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
                <DropdownMenuItem onClick={() => onEditEdge(edge)}>
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
