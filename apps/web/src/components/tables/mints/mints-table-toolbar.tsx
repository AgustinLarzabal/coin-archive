import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type MintsTableToolbarProps = {
  filterValue: string
  onFilterValueChange: (value: string) => void
  onCreateMint: () => void
}

export function MintsTableToolbar({
  filterValue,
  onFilterValueChange,
  onCreateMint,
}: MintsTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between gap-4">
      <Input
        placeholder="Filter mints by code or name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateMint}>
        Create
      </Button>
    </div>
  )
}
