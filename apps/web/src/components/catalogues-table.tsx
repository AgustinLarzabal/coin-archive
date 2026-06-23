import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { CatalogueOption } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { DataTable } from "@workspace/ui/components/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Icons } from "./icons"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { CatalogueEditForm } from "./database/catalogue-edit-form"

type CatalogueTableProps = {
  catalogues: CatalogueOption[]
}

export function CataloguesTable({ catalogues }: CatalogueTableProps) {
  const [editingCatalogue, setEditingCatalogue] =
    useState<CatalogueOption | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const columns = useMemo(
    () =>
      createColumns((catalogue) => {
        setEditingCatalogue(catalogue)
        setIsEditSheetOpen(true)
      }),
    []
  )

  function handleEditSheetOpenChange(open: boolean) {
    setIsEditSheetOpen(open)

    if (!open) {
      setEditingCatalogue(null)
    }
  }

  return (
    <>
      <DataTable columns={columns} data={catalogues} />
      <CatalogueEditSheet
        catalogue={editingCatalogue}
        open={isEditSheetOpen}
        onOpenChange={handleEditSheetOpenChange}
      />
    </>
  )
}

function createColumns(
  onEditCatalogue: (catalogue: CatalogueOption) => void
): ColumnDef<CatalogueOption>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Code
            <Icons.ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <Icons.ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
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
                  <Icons.Ellipsis />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onEditCatalogue(catalogue)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>Delete</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

type CatalogueEditSheetProps = {
  catalogue: CatalogueOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CatalogueEditSheet({
  catalogue,
  open,
  onOpenChange,
}: CatalogueEditSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Catalogue</SheetTitle>
          <SheetDescription>
            Update the catalogue code and title.
          </SheetDescription>
        </SheetHeader>

        {catalogue ? (
          <CatalogueEditForm
            catalogue={catalogue}
            onSaved={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
