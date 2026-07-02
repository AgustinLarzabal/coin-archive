import { Input } from "@workspace/ui/components/input"

type MintingTechniquesTableToolbarProps = {
  filterValue: string
  onFilterValueChange: (value: string) => void
}

export function MintingTechniquesTableToolbar({
  filterValue,
  onFilterValueChange,
}: MintingTechniquesTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-start">
      <Input
        placeholder="Filter minting techniques by code or name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
    </div>
  )
}
