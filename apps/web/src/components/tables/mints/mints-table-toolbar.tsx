import { Input } from "@workspace/ui/components/input"

type MintsTableToolbarProps = {
  filterValue: string
  onFilterValueChange: (value: string) => void
}

export function MintsTableToolbar({
  filterValue,
  onFilterValueChange,
}: MintsTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-start">
      <Input
        placeholder="Filter mints by code or name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
    </div>
  )
}
