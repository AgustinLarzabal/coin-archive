import { Button } from "@coin-archive/ui/components/button"

type EngraversTableToolbarProps = {
  onCreateEngraver: () => void
}

export function EngraversTableToolbar({
  onCreateEngraver,
}: EngraversTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-end">
      <Button type="button" onClick={onCreateEngraver}>
        Create
      </Button>
    </div>
  )
}
