import { Input } from "@coin-archive/ui/components/input"
import { Button } from "@coin-archive/ui/components/button"

type RimsTableToolbarProps = {
  filterValue: string
  onCreateRim: () => void
  onFilterValueChange: (value: string) => void
}

export function RimsTableToolbar({
  filterValue,
  onCreateRim,
  onFilterValueChange,
}: RimsTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between">
      <Input
        placeholder="Filter rims by code or name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateRim}>
        Create
      </Button>
    </div>
  )
}
