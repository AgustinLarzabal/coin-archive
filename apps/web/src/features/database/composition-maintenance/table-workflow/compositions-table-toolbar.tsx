import { Input } from "@coin-archive/ui/components/input"
import { Button } from "@coin-archive/ui/components/button"

type CompositionsTableToolbarProps = {
  nameFilter: string
  onCreateComposition: () => void
  onNameFilterChange: (value: string) => void
}

export function CompositionsTableToolbar({
  nameFilter,
  onCreateComposition,
  onNameFilterChange,
}: CompositionsTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between">
      <Input
        placeholder="Filter compositions by name..."
        value={nameFilter}
        onChange={(event) => onNameFilterChange(event.target.value)}
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateComposition}>
        Create
      </Button>
    </div>
  )
}
