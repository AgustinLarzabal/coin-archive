import type { ColumnDef } from "@tanstack/react-table"
import type { MintOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { Icons } from "../../icons"

export function createMintColumns(
  onEditMint: (mint: MintOption) => void,
  onDeleteMint: (mint: MintOption) => void
): ColumnDef<MintOption>[] {
  return [
    {
      accessorKey: "code",
      header: "Mint Code",
    },
    {
      accessorKey: "name",
      header: "Mint Name",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const mint = row.original

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
                <DropdownMenuItem onClick={() => onEditMint(mint)}>
                  Edit Mint
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteMint(mint)}
                >
                  Delete Mint
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
