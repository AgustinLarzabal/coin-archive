import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

type ShapesTableToolbarProps = {
  filterValue: string
  onCreateShape: () => void
  onFilterValueChange: (value: string) => void
}

export function ShapesTableToolbar({
  filterValue,
  onCreateShape,
  onFilterValueChange,
}: ShapesTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between">
      <Input
        placeholder="Filter shapes by code or name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateShape}>
        Create
      </Button>
    </div>
  )
}
