import { Card } from "@workspace/ui/components/card"
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"

import { CoinFormFieldError } from "./coin-form-section.shared"
import type { CoinFormSectionProps } from "./coin-form-section.shared"
import { CoinSelectField } from "./coin-select-field"
import { SurfaceImageUpload } from "../surface-image-upload"

type Face = "obverse" | "reverse"
type SurfaceField = "description" | "lettering"

export function DesignImagerySection({
  draft,
  fieldErrors,
  idPrefix,
  options,
  addFaceEngraver,
  removeFaceEngraver,
  updateEdgeSurface,
  updateFaceEngraver,
  updateFaceSurface,
  isCreateMode,
  onSurfaceImagePendingChange,
  updateSurfaceImageUploadReference,
  authorizeSurfaceImageUpload,
}: Pick<
  CoinFormSectionProps,
  "draft" | "fieldErrors" | "idPrefix" | "options"
> & {
  addFaceEngraver: (face: Face) => void
  removeFaceEngraver: (face: Face, index: number) => void
  updateFaceEngraver: (face: Face, index: number, value: string) => void
  updateFaceSurface: (face: Face, field: SurfaceField, value: string) => void
  updateEdgeSurface: (field: SurfaceField, value: string) => void
  isCreateMode: boolean
  onSurfaceImagePendingChange: (face: Face | "edge", isPending: boolean) => void
  updateSurfaceImageUploadReference: (face: Face | "edge", reference: string) => void
  authorizeSurfaceImageUpload: (input: {
    surface: Face | "edge"
    contentType: string
    contentLength: number
  }) => Promise<{ reference: string; uploadUrl: string } | { formError?: string }>
}) {
  return (
    <Card>
      <FieldSet className="px-8">
        <FieldLegend>Design &amp; Imagery</FieldLegend>
        <FieldDescription>
          Document the Obverse, Reverse, and Edge Surface through descriptions,
          lettering, images, and face-specific engraver attributions.
        </FieldDescription>
        <FieldGroup>
          {(
            [
              ["obverse", "Obverse", draft.surfaces.obverse],
              ["reverse", "Reverse", draft.surfaces.reverse],
            ] as const
          ).map(([face, label, surface]) => (
            <section key={face} className="grid gap-4 rounded border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{label} Surface</h2>
                  <p className="text-sm text-muted-foreground">
                    Description, lettering, and face-specific engravers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addFaceEngraver(face)}
                  className="rounded border px-3 py-2 text-sm"
                >
                  Add Engraver Attribution
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <SurfaceTextarea
                  label="Description"
                  value={surface.description as string}
                  error={fieldErrors[`surfaces.${face}.description`]}
                  onValueChange={(value) =>
                    updateFaceSurface(face, "description", value)
                  }
                />
                <SurfaceTextarea
                  label="Lettering"
                  value={surface.lettering as string}
                  error={fieldErrors[`surfaces.${face}.lettering`]}
                  onValueChange={(value) =>
                    updateFaceSurface(face, "lettering", value)
                  }
                />
              </div>
              {isCreateMode ? (
                <SurfaceImageUpload
                  surface={face}
                  authorizeUpload={authorizeSurfaceImageUpload}
                  onPendingChange={(isPending) =>
                    onSurfaceImagePendingChange(face, isPending)
                  }
                  onReferenceChange={(reference) =>
                    updateSurfaceImageUploadReference(face, reference)
                  }
                />
              ) : null}
              <div className="grid gap-3">
                {surface.engraverIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No Engraver Attributions added.
                  </p>
                ) : null}
                {surface.engraverIds.map((engraverId, index) => (
                  <div
                    key={`${face}-${index}`}
                    className="grid gap-3 rounded border p-3 md:grid-cols-[1fr_auto]"
                  >
                    <CoinSelectField
                      error={
                        fieldErrors[`surfaces.${face}.engraverIds.${index}`]
                      }
                      id={`${idPrefix}-${face}-engraver-${index}`}
                      label="Engraver"
                      onValueChange={(value) =>
                        updateFaceEngraver(face, index, value)
                      }
                      options={options.engravers}
                      placeholder="Select Engraver"
                      value={engraverId}
                    />
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeFaceEngraver(face, index)}
                        className="rounded border px-3 py-2 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <section className="grid gap-4 rounded border p-4">
            <div>
              <h2 className="text-lg font-semibold">Edge Surface</h2>
              <p className="text-sm text-muted-foreground">
                Description and lettering. Edge Surface does not accept
                Engraver Attributions.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SurfaceTextarea
                label="Description"
                value={draft.surfaces.edge.description as string}
                error={fieldErrors["surfaces.edge.description"]}
                onValueChange={(value) =>
                  updateEdgeSurface("description", value)
                }
              />
              <SurfaceTextarea
                label="Lettering"
                value={draft.surfaces.edge.lettering as string}
                error={fieldErrors["surfaces.edge.lettering"]}
                onValueChange={(value) => updateEdgeSurface("lettering", value)}
              />
            </div>
            {isCreateMode ? (
              <SurfaceImageUpload
                surface="edge"
                authorizeUpload={authorizeSurfaceImageUpload}
                onPendingChange={(isPending) =>
                  onSurfaceImagePendingChange("edge", isPending)
                }
                onReferenceChange={(reference) =>
                  updateSurfaceImageUploadReference("edge", reference)
                }
              />
            ) : null}
          </section>
        </FieldGroup>
      </FieldSet>
    </Card>
  )
}

function SurfaceTextarea({
  error,
  label,
  onValueChange,
  value,
}: {
  error?: string
  label: string
  onValueChange: (value: string) => void
  value: string
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="min-h-24 rounded border px-3 py-2"
      />
      <CoinFormFieldError message={error} />
    </label>
  )
}
