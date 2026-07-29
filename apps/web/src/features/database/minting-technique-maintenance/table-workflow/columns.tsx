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

export function createMintingTechniqueColumns(
  openEditMintingTechniqueSheet: (mintingTechnique: TechniqueOption) => void
): ColumnDef<TechniqueOption>[] {
  return [
    {
      accessorKey: "code",
      header: "Minting Technique Code",
    },
    {
      accessorKey: "name",
      header: "Minting Technique Name",
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
