import { Input } from "@coin-archive/ui/components/input"
import { Button } from "@coin-archive/ui/components/button"

type CurrenciesTableToolbarProps = {
  filterValue: string
  onCreateCurrency: () => void
  onFilterValueChange: (value: string) => void
}

export function CurrenciesTableToolbar({
  filterValue,
  onCreateCurrency,
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
      <Button type="button" onClick={onCreateCurrency}>
        Create
      </Button>
    </div>
  )
}
