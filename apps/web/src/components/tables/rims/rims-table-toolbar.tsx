import { Input } from "@workspace/ui/components/input"

type RimsTableToolbarProps = {
  filterValue: string
  onFilterValueChange: (value: string) => void
}

export function RimsTableToolbar({
  filterValue,
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
    </div>
  )
}
