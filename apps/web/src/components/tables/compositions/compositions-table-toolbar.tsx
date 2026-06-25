import { Input } from "@workspace/ui/components/input"

type CompositionsTableToolbarProps = {
  nameFilter: string
  onNameFilterChange: (value: string) => void
}

export function CompositionsTableToolbar({
  nameFilter,
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
    </div>
  )
}
