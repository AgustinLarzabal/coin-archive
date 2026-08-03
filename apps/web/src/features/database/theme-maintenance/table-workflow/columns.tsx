import type { ColumnDef } from "@tanstack/react-table"
import type { Theme } from "@coin-archive/api"
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

export function createThemeColumns(
  onEditTheme: (theme: Theme) => void,
  onDeleteTheme: (theme: Theme) => void
): ColumnDef<Theme>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>Theme Name</SortableColumnHeader>
      ),
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>Theme Code</SortableColumnHeader>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const theme = row.original

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
                <DropdownMenuItem onClick={() => onEditTheme(theme)}>
                  Edit Theme
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteTheme(theme)}
                >
                  Delete Theme
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
