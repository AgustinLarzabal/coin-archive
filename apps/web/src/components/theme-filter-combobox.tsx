import type { ThemeOption } from "@workspace/db"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import { getThemeOptionLabel } from "../lib/coin-search"

type ThemeFilterComboboxProps = {
  onValueChange: (theme: ThemeOption | null) => Promise<void>
  selectedTheme: ThemeOption | null
  themes: ThemeOption[]
}

function isThemeOptionEqual(left: ThemeOption, right: ThemeOption) {
  return left.code === right.code
}

export function ThemeFilterCombobox({
  onValueChange,
  selectedTheme,
  themes,
}: ThemeFilterComboboxProps) {
  return (
    <Combobox<ThemeOption>
      items={themes}
      value={selectedTheme}
      itemToStringLabel={getThemeOptionLabel}
      isItemEqualToValue={isThemeOptionEqual}
      onValueChange={onValueChange}
    >
      <ComboboxInput placeholder="Filter by theme" showClear />
      <ComboboxContent>
        <ComboboxEmpty>No themes found.</ComboboxEmpty>
        <ComboboxList>
          {(theme: ThemeOption) => (
            <ComboboxItem key={theme.code} value={theme}>
              <span>{theme.name}</span>
              <span className="text-muted-foreground">{theme.code}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
