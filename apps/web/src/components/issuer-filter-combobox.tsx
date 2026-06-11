import type { IssuerOption } from "@workspace/db"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type IssuerFilterComboboxProps = {
  issuers: IssuerOption[]
  onValueChange: (issuer: IssuerOption | null) => Promise<void>
  selectedIssuer: IssuerOption | null
}

export function IssuerFilterCombobox({
  issuers,
  onValueChange,
  selectedIssuer,
}: IssuerFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<IssuerOption>
      emptyMessage="No issuers found."
      items={issuers}
      itemToStringLabel={(issuer) => issuer.name}
      onValueChange={onValueChange}
      placeholder="Filter by issuer"
      selectedItem={selectedIssuer}
    />
  )
}
