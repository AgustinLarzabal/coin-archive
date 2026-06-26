import { Button } from "@workspace/ui/components/button"

type DistributionsTableToolbarProps = {
  onCreateDistribution: () => void
}

export function DistributionsTableToolbar({
  onCreateDistribution,
}: DistributionsTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-end">
      <Button type="button" onClick={onCreateDistribution}>
        Create
      </Button>
    </div>
  )
}
