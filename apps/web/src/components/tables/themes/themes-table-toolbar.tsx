import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

type ThemesTableToolbarProps = {
  filterValue: string
  onCreateTheme: () => void
  onFilterValueChange: (value: string) => void
}

export function ThemesTableToolbar({
  filterValue,
  onCreateTheme,
  onFilterValueChange,
}: ThemesTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between">
      <Input
        placeholder="Filter themes by code or name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateTheme}>
        Create
      </Button>
    </div>
  )
}
