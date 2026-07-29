import { Card } from "@coin-archive/ui/components/card"
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@coin-archive/ui/components/field"

import type { CoinFormSectionProps } from "./coin-form-section.shared"
import { CoinMultiComboboxField } from "./coin-multi-combobox-field"

export function ThemesSection({
  draft,
  idPrefix,
  options,
  themeErrors,
  replaceThemes,
}: Pick<CoinFormSectionProps, "draft" | "idPrefix" | "options"> & {
  themeErrors: string[]
  replaceThemes: (themeIds: string[]) => void
}) {
  return (
    <Card>
      <FieldSet className="px-8">
        <FieldLegend>Themes</FieldLegend>
        <FieldDescription>
          Add optional controlled themes used to classify the coin's subject
          matter or motifs.
        </FieldDescription>
        <FieldGroup>
          <CoinMultiComboboxField
            errors={themeErrors}
            id={`${idPrefix}-themes-combobox`}
            label="Theme Attributions"
            onValueChange={replaceThemes}
            options={options.themes}
            placeholder="Search and add themes"
            values={draft.themes.map((theme) => theme.themeId)}
          />
        </FieldGroup>
      </FieldSet>
    </Card>
  )
}
