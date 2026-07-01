import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type IssuersTableToolbarProps = {
  filterValue: string
  onFilterValueChange: (value: string) => void
  onCreateIssuer: () => void
}

export function IssuersTableToolbar({
  filterValue,
  onFilterValueChange,
  onCreateIssuer,
}: IssuersTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between gap-2">
      <Input
        placeholder="Filter issuers by name, code, ISO code, or parent issuer..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
      <Button type="button" onClick={onCreateIssuer}>
        Create
      </Button>
    </div>
  )
}
