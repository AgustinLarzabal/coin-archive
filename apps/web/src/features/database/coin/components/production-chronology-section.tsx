import { Card } from "@workspace/ui/components/card"
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"

import type { CoinFormSectionProps } from "./coin-form-section.shared"
import { CoinInputField } from "./coin-input-field"
import { CoinMultiComboboxField } from "./coin-multi-combobox-field"
import { CoinSelectField } from "./coin-select-field"

export function ProductionChronologySection({
  draft,
  fieldErrors,
  idPrefix,
  options,
  updateDraft,
  mintErrors,
  replaceMints,
}: CoinFormSectionProps & {
  mintErrors: string[]
  replaceMints: (mintIds: string[]) => void
}) {
  return (
    <Card>
      <FieldSet className="px-8">
        <FieldLegend>Production &amp; Chronology</FieldLegend>
        <FieldDescription>
          Describe when and how the coin was made, including issue years,
          minting method, mintage, and mint attributions.
        </FieldDescription>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <CoinSelectField
              error={fieldErrors.techniqueId}
              id={`${idPrefix}-techniqueId`}
              label="Minting Technique"
              name="techniqueId"
              onValueChange={(value) => updateDraft("techniqueId", value)}
              options={options.techniques}
              placeholder="Unknown"
              value={draft.techniqueId as string}
            />
            <CoinInputField
              error={fieldErrors.mintage}
              id={`${idPrefix}-mintage`}
              label="Mintage"
              name="mintage"
              onValueChange={(value) => updateDraft("mintage", value)}
              value={draft.mintage as string}
            />
            <CoinInputField
              error={fieldErrors.minYear}
              id={`${idPrefix}-minYear`}
              label="Earliest Issue Year"
              name="minYear"
              onValueChange={(value) => updateDraft("minYear", value)}
              value={draft.minYear as string}
            />
            <CoinInputField
              error={fieldErrors.maxYear}
              id={`${idPrefix}-maxYear`}
              label="Latest Issue Year"
              name="maxYear"
              onValueChange={(value) => updateDraft("maxYear", value)}
              value={draft.maxYear as string}
            />
          </div>
          <CoinMultiComboboxField
            errors={mintErrors}
            id={`${idPrefix}-mints-combobox`}
            label="Mint Attributions"
            onValueChange={replaceMints}
            options={options.mints}
            placeholder="Search and add mints"
            values={draft.mints.map((mint) => mint.mintId)}
          />
        </FieldGroup>
      </FieldSet>
    </Card>
  )
}
