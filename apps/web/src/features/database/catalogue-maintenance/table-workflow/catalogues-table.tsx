import { useMemo, useState } from "react"
import type { Catalogue } from "@coin-archive/api"
import { DataTable } from "@coin-archive/ui/components/data-table"

import { createCatalogueColumns } from "./columns"
import { CatalogueEditSheet } from "../sheet-workflow/catalogue-edit-sheet"
import { CataloguesTableToolbar } from "./catalogues-table-toolbar"

type CatalogueTableProps = {
  catalogues: Catalogue[]
}

export function CataloguesTable({ catalogues }: CatalogueTableProps) {
  const [editingCatalogue, setEditingCatalogue] = useState<Catalogue | null>(
    null
  )
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const columns = useMemo(
    () =>
      createCatalogueColumns((catalogue) => {
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

  function handleCreateCatalogue() {
    setEditingCatalogue(null)
    setIsEditSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={catalogues}
        toolbar={(table) => (
          <CataloguesTableToolbar
            table={table}
            onCreateCatalogue={handleCreateCatalogue}
          />
        )}
      />
      <CatalogueEditSheet
        catalogue={editingCatalogue}
        open={isEditSheetOpen}
        onOpenChange={handleEditSheetOpenChange}
      />
    </>
  )
}
