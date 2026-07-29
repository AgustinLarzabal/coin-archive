import type { ColumnDef } from "@tanstack/react-table"
import type { ThemeOption } from "@coin-archive/db"
import { Button } from "@coin-archive/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coin-archive/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

export function createThemeColumns(
  openEditThemeSheet: (theme: ThemeOption) => void
): ColumnDef<ThemeOption>[] {
  return [
    {
      accessorKey: "code",
      header: "Theme Code",
    },
    {
      accessorKey: "name",
      header: "Theme Name",
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
                <DropdownMenuItem onClick={() => openEditThemeSheet(theme)}>
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
