import type { CoinReferenceDraft } from "../actions"
import { Card } from "@workspace/ui/components/card"
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"

import { CoinFormFieldError } from "./coin-form-section.shared"
import type { CoinFormSectionProps } from "./coin-form-section.shared"
import { CoinInputField } from "./coin-input-field"
import { CoinSelectField } from "./coin-select-field"

export function CatalogueNotesReferencesSection({
  draft,
  fieldErrors,
  idPrefix,
  options,
  updateDraft,
  addReference,
  removeReference,
  updateReference,
}: CoinFormSectionProps & {
  addReference: () => void
  removeReference: (index: number) => void
  updateReference: (
    index: number,
    field: keyof CoinReferenceDraft,
    value: string
  ) => void
}) {
  return (
    <Card>
      <FieldSet className="px-8">
        <FieldLegend>Catalogue Notes &amp; References</FieldLegend>
        <FieldDescription>
          Preserve editorial remarks and structured catalogue citations
          supporting this Coin record.
        </FieldDescription>
        <FieldGroup>
          <label className="grid gap-1 text-sm">
            <span>Coin Comment</span>
            <textarea
              name="comments"
              value={draft.comments as string}
              onChange={(event) => updateDraft("comments", event.target.value)}
              className="min-h-28 rounded border px-3 py-2"
            />
            <CoinFormFieldError message={fieldErrors.comments} />
          </label>
          <section className="grid gap-4 rounded border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Catalogue References</h2>
                <p className="text-sm text-muted-foreground">
                  Add structured Catalogue and Reference Number rows.
                </p>
              </div>
              <button
                type="button"
                onClick={addReference}
                className="rounded border px-3 py-2 text-sm"
              >
                Add Catalogue Reference
              </button>
            </div>
            {draft.references.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No Catalogue References added.
              </p>
            ) : null}
            {draft.references.map((reference, index) => (
              <div
                key={index}
                className="grid gap-3 rounded border p-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <CoinSelectField
                  error={fieldErrors[`references.${index}.catalogueId`]}
                  id={`${idPrefix}-catalogue-${index}`}
                  label="Catalogue"
                  onValueChange={(value) =>
                    updateReference(index, "catalogueId", value)
                  }
                  options={options.catalogues}
                  placeholder="Select Catalogue"
                  required
                  value={reference.catalogueId}
                />
                <CoinInputField
                  error={fieldErrors[`references.${index}.number`]}
                  id={`${idPrefix}-reference-number-${index}`}
                  label="Reference Number"
                  onValueChange={(value) =>
                    updateReference(index, "number", value)
                  }
                  required
                  value={reference.number}
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeReference(index)}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </section>
        </FieldGroup>
      </FieldSet>
    </Card>
  )
}
