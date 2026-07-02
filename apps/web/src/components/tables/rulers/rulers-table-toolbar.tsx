import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type RulersTableToolbarProps = {
  filterValue: string
  onCreateRuler: () => void
  onFilterValueChange: (value: string) => void
}

export function RulersTableToolbar({
  filterValue,
  onCreateRuler,
  onFilterValueChange,
}: RulersTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between">
      <Input
        placeholder="Filter rulers by code, name, or ruler group..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateRuler}>
        Create
      </Button>
    </div>
  )
}
