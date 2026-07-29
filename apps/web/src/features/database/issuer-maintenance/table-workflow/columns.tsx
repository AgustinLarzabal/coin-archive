import type { ColumnDef } from "@tanstack/react-table"
import type { IssuerMaintenanceRecord } from "@coin-archive/db"
import { Button } from "@coin-archive/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coin-archive/ui/components/dropdown-menu"

import { Icons } from "@/components/icons"

const NO_PARENT_ISSUER_LABEL = "No Parent Issuer"

export function createIssuerColumns(
  onEditIssuer: (issuer: IssuerMaintenanceRecord) => void,
  onDeleteIssuer: (issuer: IssuerMaintenanceRecord) => void
): ColumnDef<IssuerMaintenanceRecord>[] {
  return [
    {
      accessorKey: "name",
      header: "Issuer Name",
    },
    {
      accessorKey: "code",
      header: "Issuer Code",
    },
    {
      accessorKey: "isoCode",
      header: "Issuer ISO Code",
    },
    {
      id: "parent",
      header: "Parent Issuer",
      cell: ({ row }) => {
        const parent = row.original.parent

        if (parent === null) {
          return NO_PARENT_ISSUER_LABEL
        }

        return `${parent.name} (${parent.code})`
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const issuer = row.original

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
                <DropdownMenuItem onClick={() => onEditIssuer(issuer)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteIssuer(issuer)}
                >
                  Delete Issuer
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
