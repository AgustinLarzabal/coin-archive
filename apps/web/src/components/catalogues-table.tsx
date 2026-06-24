import { useMemo, useState } from "react"
import type { CatalogueOption } from "@workspace/db"
import { DataTable } from "@workspace/ui/components/data-table"

import { createCatalogueColumns } from "./tables/catalogues/columns"
import { CatalogueEditSheet } from "./tables/catalogues/catalogue-edit-sheet"

type CatalogueTableProps = {
  catalogues: CatalogueOption[]
}

export function CataloguesTable({ catalogues }: CatalogueTableProps) {
  const [editingCatalogue, setEditingCatalogue] =
    useState<CatalogueOption | null>(null)
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
