import { Input } from "@workspace/ui/components/input"

type CurrenciesTableToolbarProps = {
  filterValue: string
  onFilterValueChange: (value: string) => void
}

export function CurrenciesTableToolbar({
  filterValue,
  onFilterValueChange,
}: CurrenciesTableToolbarProps) {
  return (
    <div className="flex grow items-center justify-between">
      <Input
        placeholder="Filter currencies by code, name, or full name..."
        value={filterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="max-w-sm"
      />
    </div>
  )
}
