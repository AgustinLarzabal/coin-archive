import { Input } from "@workspace/ui/components/input"

type ThemesTableToolbarProps = {
  filterValue: string
  onFilterValueChange: (value: string) => void
}

export function ThemesTableToolbar({
  filterValue,
  onFilterValueChange,
}: ThemesTableToolbarProps) {
  return (
    <div className="flex grow items-center">
      <Input
        placeholder="Filter themes by code or name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
    </div>
  )
}
