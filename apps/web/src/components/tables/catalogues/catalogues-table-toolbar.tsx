import type { CatalogueOption } from "@workspace/db"
import { Input } from "@workspace/ui/components/input"
import type { Table } from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"

type CataloguesTableToolbarProps = {
  onCreateCatalogue: () => void
  table: Table<CatalogueOption>
}

export function CataloguesTableToolbar({
  onCreateCatalogue,
  table,
}: CataloguesTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between">
      <Input
        placeholder="Filter catalogues..."
        value={(table.getColumn("title")?.getFilterValue() ?? "") as string}
        onChange={(event) =>
          table.getColumn("title")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateCatalogue}>
        Create
      </Button>
    </div>
  )
}
