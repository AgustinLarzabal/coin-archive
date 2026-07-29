import { Card } from "@coin-archive/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@coin-archive/ui/components/field"
import { Input } from "@coin-archive/ui/components/input"

import { CoinFormFieldError } from "./coin-form-section.shared"
import type { CoinFormSectionProps } from "./coin-form-section.shared"
import { CoinMultiComboboxField } from "./coin-multi-combobox-field"
import { CoinSelectField } from "./coin-select-field"

export function IdentityClassificationSection({
  draft,
  fieldErrors,
  idPrefix,
  options,
  updateDraft,
  rulerErrors,
  replaceRulers,
}: CoinFormSectionProps & {
  rulerErrors: string[]
  replaceRulers: (rulerIds: string[]) => void
}) {
  return (
    <FieldGroup>
      <Card>
        <FieldSet className="px-8">
          <FieldLegend>Identity &amp; Classification</FieldLegend>
          <FieldDescription>
            Establish the coin's core catalogue identity and the authority,
            distribution, composition, and ruler attributions that define it.
          </FieldDescription>
          <FieldGroup>
            <Field data-invalid={fieldErrors.title !== undefined}>
              <FieldLabel htmlFor={`${idPrefix}-title`}>
                Coin Title <FieldRequirement required />
              </FieldLabel>
              <Input
                id={`${idPrefix}-title`}
                name="title"
                value={draft.title}
                onChange={(event) => updateDraft("title", event.target.value)}
                aria-required
                required
              />
              <CoinFormFieldError message={fieldErrors.title} />
            </Field>
            <div className="grid gap-4 md:grid-cols-3">
              <CoinSelectField
                error={fieldErrors.issuerId}
                id={`${idPrefix}-issuer`}
                label="Issuer"
                name="issuerId"
                onValueChange={(value) => updateDraft("issuerId", value)}
                options={options.issuers}
                placeholder="Select Issuer"
                required
                value={draft.issuerId}
              />
              <CoinSelectField
                error={fieldErrors.distributionId}
                id={`${idPrefix}-distribution`}
                label="Distribution"
                name="distributionId"
                onValueChange={(value) => updateDraft("distributionId", value)}
                options={options.distributions}
                placeholder="Select Distribution"
                required
                value={draft.distributionId}
              />
              <CoinSelectField
                error={fieldErrors.compositionId}
                id={`${idPrefix}-composition`}
                label="Composition"
                name="compositionId"
                onValueChange={(value) => updateDraft("compositionId", value)}
                options={options.compositions}
                placeholder="Select Composition"
                required
                value={draft.compositionId}
              />
            </div>
            <CoinMultiComboboxField
              description="Search for and add every ruler attributed to this coin. The selected chip order determines the attribution order."
              errors={rulerErrors}
              id={`${idPrefix}-rulers-combobox`}
              label="Ruler Attributions"
              onValueChange={replaceRulers}
              options={options.rulers}
              placeholder="Search and add rulers"
              required
              values={draft.rulers.map((ruler) => ruler.rulerId)}
            />
          </FieldGroup>
        </FieldSet>
      </Card>
    </FieldGroup>
  )
}

function FieldRequirement({ required }: { required: boolean }) {
  if (!required) return null

  return <span className="font-normal text-muted-foreground">(Required)</span>
}
