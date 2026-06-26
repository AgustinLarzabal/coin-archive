import type { ColumnDef } from "@tanstack/react-table"
import type { EdgeOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { Icons } from "../../icons"

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
