import type { CatalogueOption } from "@workspace/db"
import { getCatalogueOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type CatalogueFilterComboboxProps = {
  catalogues: CatalogueOption[]
  onValueChange: (catalogue: CatalogueOption | null) => Promise<void>
  selectedCatalogue: CatalogueOption | null
}

export function CatalogueFilterCombobox({
  catalogues,
  onValueChange,
  selectedCatalogue,
}: CatalogueFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<CatalogueOption>
      emptyMessage="No catalogues found."
      items={catalogues}
      itemToStringLabel={getCatalogueOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by catalogue"
      renderItemLabel={(catalogue) => catalogue.title}
      selectedItem={selectedCatalogue}
    />
  )
}
