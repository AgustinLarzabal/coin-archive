import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type IssuersTableToolbarProps = {
  filterValue: string
  onCreateIssuer: () => void
  onFilterValueChange: (value: string) => void
}

export function IssuersTableToolbar({
  filterValue,
  onCreateIssuer,
  onFilterValueChange,
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
        Create Issuer
      </Button>
    </div>
  )
}
