import { Input } from "@workspace/ui/components/input"

type OrientationsTableToolbarProps = {
  filterValue: string
  onFilterValueChange: (value: string) => void
}

export function OrientationsTableToolbar({
  filterValue,
  onFilterValueChange,
}: OrientationsTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-start">
      <Input
        placeholder="Filter orientations by code or name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
    </div>
  )
}
