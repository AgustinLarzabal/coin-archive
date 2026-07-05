import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

type MintingTechniquesTableToolbarProps = {
  filterValue: string
  onCreateMintingTechnique: () => void
  onFilterValueChange: (value: string) => void
}

export function MintingTechniquesTableToolbar({
  filterValue,
  onCreateMintingTechnique,
  onFilterValueChange,
}: MintingTechniquesTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between">
      <Input
        placeholder="Filter minting techniques by code or name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateMintingTechnique}>
        Create
      </Button>
    </div>
  )
}
