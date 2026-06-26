import { Input } from "@workspace/ui/components/input"

type IssuersTableToolbarProps = {
  filterValue: string
  onFilterValueChange: (value: string) => void
}

export function IssuersTableToolbar({
  filterValue,
  onFilterValueChange,
}: IssuersTableToolbarProps) {
  return (
    <div className="flex grow items-center">
      <Input
        placeholder="Filter issuers by name, code, ISO code, or parent issuer..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
    </div>
  )
}
