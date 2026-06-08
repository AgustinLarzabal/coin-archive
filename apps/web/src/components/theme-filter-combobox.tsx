import type { ThemeOption } from "@workspace/db"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import { getThemeOptionLabel, isCodeOptionEqual } from "../lib/coin-search"

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
    <Combobox<ThemeOption>
      items={themes}
      value={selectedTheme}
      itemToStringLabel={getThemeOptionLabel}
      isItemEqualToValue={isCodeOptionEqual}
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
