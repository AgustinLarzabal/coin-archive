import { Input } from "@workspace/ui/components/input"

type ShapesTableToolbarProps = {
  filterValue: string
  onFilterValueChange: (value: string) => void
}

export function ShapesTableToolbar({
  filterValue,
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
    </div>
  )
}
