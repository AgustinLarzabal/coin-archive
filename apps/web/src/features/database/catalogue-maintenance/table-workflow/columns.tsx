import type { ColumnDef } from "@tanstack/react-table"
import type { Catalogue } from "@coin-archive/api"
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

export function createCatalogueColumns(
  onEditCatalogue: (catalogue: Catalogue) => void
): ColumnDef<Catalogue>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>Code</SortableColumnHeader>
      ),
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>Title</SortableColumnHeader>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const catalogue = row.original

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
                <DropdownMenuItem onClick={() => onEditCatalogue(catalogue)}>
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
