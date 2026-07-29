import { Button } from "@coin-archive/ui/components/button"
import { Input } from "@coin-archive/ui/components/input"

type RulerGroupsTableToolbarProps = {
  filterValue: string
  onCreateRulerGroup: () => void
  onFilterValueChange: (value: string) => void
}

export function RulerGroupsTableToolbar({
  filterValue,
  onCreateRulerGroup,
  onFilterValueChange,
}: RulerGroupsTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between">
      <Input
        placeholder="Filter ruler groups by code or name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateRulerGroup}>
        Create
      </Button>
    </div>
  )
}
