import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

type EdgesTableToolbarProps = {
  filterValue: string
  onCreateEdge: () => void
  onFilterValueChange: (value: string) => void
}

export function EdgesTableToolbar({
  filterValue,
  onCreateEdge,
  onFilterValueChange,
}: EdgesTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between">
      <Input
        placeholder="Filter edges by code or name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateEdge}>
        Create
      </Button>
    </div>
  )
}
