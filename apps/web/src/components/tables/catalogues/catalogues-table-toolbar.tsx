import type { CatalogueOption } from "@workspace/db"
import { Input } from "@workspace/ui/components/input"
import type { Table } from "@tanstack/react-table"

type CataloguesTableToolbarProps = {
  table: Table<CatalogueOption>
}

export function CataloguesTableToolbar({ table }: CataloguesTableToolbarProps) {
  return (
    <Input
      placeholder="Filter catalogues..."
      value={(table.getColumn("title")?.getFilterValue() ?? "") as string}
      onChange={(event) =>
        table.getColumn("title")?.setFilterValue(event.target.value)
      }
    />
  )
}
