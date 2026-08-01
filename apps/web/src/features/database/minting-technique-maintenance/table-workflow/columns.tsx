import type { ColumnDef } from "@tanstack/react-table"
import type { TechniqueOption } from "@coin-archive/db"
import { Button } from "@coin-archive/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coin-archive/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

import { SortableColumnHeader } from "../../sortable-column-header"

export function createMintingTechniqueColumns(
  openEditMintingTechniqueSheet: (mintingTechnique: TechniqueOption) => void
): ColumnDef<TechniqueOption>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>
          Minting Technique Code
        </SortableColumnHeader>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>
          Minting Technique Name
        </SortableColumnHeader>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const mintingTechnique = row.original

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
                onClick={() => openEditMintingTechniqueSheet(mintingTechnique)}
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
