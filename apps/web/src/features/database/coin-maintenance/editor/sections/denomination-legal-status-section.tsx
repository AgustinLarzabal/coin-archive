import type { CoinDraft } from "../../actions"
import { Card } from "@workspace/ui/components/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@workspace/ui/components/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"

import { CoinFormFieldError } from "./coin-form-section.shared"
import type { CoinFormSectionProps } from "./coin-form-section.shared"
import { CoinInputField } from "./coin-input-field"
import { CoinSelectField } from "./coin-select-field"

export function DenominationLegalStatusSection({
  draft,
  fieldErrors,
  idPrefix,
  options,
  updateDraft,
}: CoinFormSectionProps) {
  return (
    <Card>
      <FieldSet className="px-8">
        <FieldLegend>Denomination &amp; Legal Status</FieldLegend>
        <FieldDescription>
          Record the coin's Face Value and whether that denomination is known to
          remain legally monetized.
        </FieldDescription>
        <FieldGroup>
          <div className="grid grid-cols-8 gap-4">
            <CoinSelectField
              className="col-span-4"
              error={fieldErrors.currencyId}
              id={`${idPrefix}-currency`}
              label="Currency"
              name="currencyId"
              onValueChange={(value) => updateDraft("currencyId", value)}
              options={options.currencies}
              placeholder="Select Currency"
              required
              value={draft.currencyId}
            />
            <CoinInputField
              className="col-span-2"
              error={fieldErrors.faceValueText}
              id={`${idPrefix}-face-value-text`}
              label="Face Value text"
              name="faceValueText"
              onValueChange={(value) => updateDraft("faceValueText", value)}
              required
              value={draft.faceValueText}
            />
            <CoinInputField
              className="col-span-2"
              error={fieldErrors.faceValueNumericValue}
              id={`${idPrefix}-face-value-numeric-value`}
              label="Face Value numeric"
              name="faceValueNumericValue"
              onValueChange={(value) =>
                updateDraft("faceValueNumericValue", value)
              }
              required
              value={draft.faceValueNumericValue as string}
            />
          </div>
          <FieldSet>
            <FieldLegend variant="label">
              Demonetization Status <FieldRequirement required />
            </FieldLegend>
            <RadioGroup
              name="demonetizationStatus"
              value={draft.demonetizationStatus}
              onValueChange={(value) =>
                updateDraft(
                  "demonetizationStatus",
                  value as CoinDraft["demonetizationStatus"]
                )
              }
              aria-invalid={fieldErrors.demonetizationStatus !== undefined}
              aria-required
              className="grid gap-3 md:grid-cols-3"
            >
              <StatusOption value="unknown" title="Unknown">
                The coin's legal monetary status has not been established.
              </StatusOption>
              <StatusOption value="not-demonetized" title="Not demonetized">
                The coin is known to remain legally monetized.
              </StatusOption>
              <StatusOption value="demonetized" title="Demonetized">
                The coin is known to no longer be legally monetized.
              </StatusOption>
            </RadioGroup>
            <FieldGroup>
              <CoinFormFieldError message={fieldErrors.demonetizationStatus} />
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </FieldSet>
    </Card>
  )
}

function FieldRequirement({ required }: { required: boolean }) {
  if (!required) return null

  return <span className="font-normal text-muted-foreground">(Required)</span>
}

function StatusOption({
  children,
  title,
  value,
}: {
  children: string
  title: string
  value: string
}) {
  return (
    <FieldLabel>
      <Field orientation="horizontal">
        <RadioGroupItem value={value} />
        <FieldContent>
          <FieldTitle>{title}</FieldTitle>
          <FieldDescription>{children}</FieldDescription>
        </FieldContent>
      </Field>
    </FieldLabel>
  )
}
