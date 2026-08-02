import { Input } from "@coin-archive/ui/components/input"
import { Button } from "@coin-archive/ui/components/button"

type DistributionsTableToolbarProps = {
  nameFilter: string
  onCreateDistribution: () => void
  onNameFilterChange: (value: string) => void
}

export function DistributionsTableToolbar({
  nameFilter,
  onCreateDistribution,
  onNameFilterChange,
}: DistributionsTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between">
      <Input
        placeholder="Filter distributions by name..."
        value={nameFilter}
        onChange={(event) => onNameFilterChange(event.target.value)}
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateDistribution}>
        Create
      </Button>
    </div>
  )
}
