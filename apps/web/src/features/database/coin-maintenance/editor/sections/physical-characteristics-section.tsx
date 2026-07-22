import type { CoinDraft } from "../../actions"
import { Card } from "@workspace/ui/components/card"
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"

import type { CoinFormSectionProps } from "./coin-form-section.shared"
import { CoinInputField } from "./coin-input-field"
import { CoinSelectField } from "./coin-select-field"

export function PhysicalCharacteristicsSection({
  draft,
  fieldErrors,
  idPrefix,
  options,
  updateDraft,
}: CoinFormSectionProps) {
  return (
    <Card>
      <FieldSet className="px-8">
        <FieldLegend>Physical Characteristics</FieldLegend>
        <FieldDescription>
          Capture the coin's measurable and controlled physical properties,
          including shape, dimensions, orientation, edge, and rim.
        </FieldDescription>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["orientationId", "Orientation", options.orientations],
              ["shapeId", "Shape", options.shapes],
              ["edgeId", "Edge", options.edges],
              ["rimId", "Rim", options.rims],
            ] as const
          ).map(([fieldName, label, fieldOptions]) => (
            <CoinSelectField
              key={fieldName}
              error={fieldErrors[fieldName]}
              id={`${idPrefix}-${fieldName}`}
              label={label}
              name={fieldName}
              onValueChange={(value) =>
                updateDraft(fieldName, value as CoinDraft[typeof fieldName])
              }
              options={fieldOptions}
              placeholder="Unknown"
              value={draft[fieldName] as string}
            />
          ))}
          {(
            [
              ["weight", "Weight"],
              ["diameter", "Diameter"],
              ["thickness", "Thickness"],
            ] as const
          ).map(([fieldName, label]) => (
            <CoinInputField
              key={fieldName}
              error={fieldErrors[fieldName]}
              id={`${idPrefix}-${fieldName}`}
              label={label}
              name={fieldName}
              onValueChange={(value) =>
                updateDraft(fieldName, value as CoinDraft[typeof fieldName])
              }
              value={draft[fieldName] as string}
            />
          ))}
        </FieldGroup>
      </FieldSet>
    </Card>
  )
}
