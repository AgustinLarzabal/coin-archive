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

import { SortableColumnHeader } from "../../sortable-column-header"

const NO_PARENT_ISSUER_LABEL = "No Parent Issuer"

export function createIssuerColumns(
  onEditIssuer: (issuer: IssuerMaintenanceRecord) => void,
  onDeleteIssuer: (issuer: IssuerMaintenanceRecord) => void
): ColumnDef<IssuerMaintenanceRecord>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>Issuer Name</SortableColumnHeader>
      ),
      cell: ({ row }) => {
        const issuer = row.original

        return (
          <div className="flex items-center gap-2">
            <img
              src={`https://flagcdn.com/${issuer.isoCode.toLowerCase()}.svg`}
              alt={`${issuer.name} flag`}
              className="size-4 rounded-full object-cover"
            />
            <span>{issuer.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>Issuer Code</SortableColumnHeader>
      ),
    },
    {
      accessorKey: "isoCode",
      header: ({ column }) => (
        <SortableColumnHeader column={column}>
          Issuer ISO Code
        </SortableColumnHeader>
      ),
    },
    {
      id: "parent",
      accessorFn: (issuer) => issuer.parent?.name ?? NO_PARENT_ISSUER_LABEL,
      header: ({ column }) => (
        <SortableColumnHeader column={column}>
          Parent Issuer
        </SortableColumnHeader>
      ),
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
