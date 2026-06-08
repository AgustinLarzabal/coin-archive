import type { ThemeOption } from "@workspace/db"
import { getThemeOptionLabel } from "../lib/coin-search"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type ThemeFilterComboboxProps = {
  onValueChange: (theme: ThemeOption | null) => Promise<void>
  selectedTheme: ThemeOption | null
  themes: ThemeOption[]
}

export function ThemeFilterCombobox({
  onValueChange,
  selectedTheme,
  themes,
}: ThemeFilterComboboxProps) {
  return (
    <NamedCodeFilterCombobox<ThemeOption>
      emptyMessage="No themes found."
      items={themes}
      itemToStringLabel={getThemeOptionLabel}
      onValueChange={onValueChange}
      placeholder="Filter by theme"
      selectedItem={selectedTheme}
    />
  )
}
