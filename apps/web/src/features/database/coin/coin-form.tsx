import { useEffect, useRef, useState } from "react"
import type { ComponentProps, FormEvent } from "react"
import { useBlocker, useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CoinMaintenanceRecord } from "@workspace/db"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  CoinDraft,
  CoinEdgeSurfaceDraft,
  CoinFaceSurfaceDraft,
  CoinFieldErrors,
  CoinMutationResult,
  CoinReferenceDraft,
} from "./actions"
import {
  coinDraftSchema,
  getCoinFieldErrors,
  submitCreateCoin,
  submitUpdateCoin,
  updateCoinInputSchema,
} from "./actions"
import {
  areCoinDraftsEqual,
  createEmptyRulerAttribution,
  getInitialCoinDraft,
  getNextEditSuccessMessage,
  hasRequiredCoinDraftFields,
} from "./coin-form.shared"
import type { CoinFormOptions } from "./coin-form.shared"
import { Card } from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@workspace/ui/components/combobox"
import {
  FieldSet,
  FieldGroup,
  FieldLegend,
  FieldDescription,
  FieldContent,
  FieldError,
  Field,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"

const UNSAVED_CHANGES_WARNING =
  "You have unsaved changes. Are you sure you want to leave this page?"

type CoinFormProps =
  | {
      mode: "create"
      options: CoinFormOptions
    }
  | {
      coin: CoinMaintenanceRecord
      mode: "edit"
      options: CoinFormOptions
    }

const createCoinAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: CoinDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    return submitCreateCoin(session?.user ?? null, data)
  })

const updateCoinAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: CoinDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    return submitUpdateCoin(session?.user ?? null, data)
  })

function createOptionLabel(option: {
  code: string
  name?: string
  title?: string
}) {
  return `${option.name ?? option.title} (${option.code})`
}

function renderSelectOptions(
  options: Array<{ id: string; code: string; name?: string; title?: string }>
) {
  return options.map((option) => (
    <SelectItem key={option.id} value={option.id}>
      {createOptionLabel(option)}
    </SelectItem>
  ))
}

type SelectOption = {
  id: string
  code: string
  name?: string
  title?: string
}

type CoinSelectFieldProps = {
  className?: string
  error?: string
  id: string
  label: string
  name?: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder: string
  value: string
}

function CoinSelectField({
  className,
  error,
  id,
  label,
  name,
  onValueChange,
  options,
  placeholder,
  value,
}: CoinSelectFieldProps) {
  return (
    <Field className={className} data-invalid={error !== undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        name={name}
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue ?? "")}
      >
        <SelectTrigger
          id={id}
          aria-invalid={error !== undefined}
          className="w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>{renderSelectOptions(options)}</SelectGroup>
        </SelectContent>
      </Select>
      <FieldError errors={error ? [{ message: error }] : undefined} />
    </Field>
  )
}

type CoinInputFieldProps = {
  className?: string
  error?: string
  id: string
  label: string
  name?: string
  onValueChange: (value: string) => void
  type?: ComponentProps<typeof Input>["type"]
  value: string
}

function CoinInputField({
  className,
  error,
  id,
  label,
  name,
  onValueChange,
  type,
  value,
}: CoinInputFieldProps) {
  return (
    <Field className={className} data-invalid={error !== undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={error !== undefined}
      />
      <FieldError errors={error ? [{ message: error }] : undefined} />
    </Field>
  )
}

type CoinMultiComboboxFieldProps = {
  description?: string
  errors: string[]
  id: string
  label: string
  onValueChange: (values: string[]) => void
  options: SelectOption[]
  placeholder: string
  values: string[]
}

function CoinMultiComboboxField({
  description,
  errors,
  id,
  label,
  onValueChange,
  options,
  placeholder,
  values,
}: CoinMultiComboboxFieldProps) {
  const selectedOptions = values.flatMap((value) =>
    options.filter((option) => option.id === value)
  )

  return (
    <Field data-invalid={errors.length > 0}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        items={options}
        itemToStringValue={createOptionLabel}
        multiple
        value={selectedOptions}
        onValueChange={(selected) =>
          onValueChange(selected.map((option) => option.id))
        }
      >
        <ComboboxChips>
          <ComboboxValue>
            {selectedOptions.map((option) => (
              <ComboboxChip key={option.id}>
                {createOptionLabel(option)}
              </ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput id={id} placeholder={placeholder} />
        </ComboboxChips>
        <ComboboxContent>
          <ComboboxEmpty>No options found.</ComboboxEmpty>
          <ComboboxList>
            {(option) => (
              <ComboboxItem key={option.id} value={option}>
                {createOptionLabel(option)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError errors={errors.map((message) => ({ message }))} />
    </Field>
  )
}

function createFieldErrorResult(
  fieldErrors: CoinFieldErrors
): CoinMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

function validateDraft(input: CoinDraft | (CoinDraft & { id: string })) {
  const parsedInput =
    "id" in input
      ? updateCoinInputSchema.safeParse(input)
      : coinDraftSchema.safeParse(input)

  if (parsedInput.success) {
    return null
  }

  return createFieldErrorResult(getCoinFieldErrors(parsedInput.error.issues))
}

function renderFieldError(message: string | undefined) {
  if (!message) {
    return null
  }

  return <span className="text-sm text-destructive">{message}</span>
}

function renderPathFieldError(fieldErrors: CoinFieldErrors, path: string) {
  return renderFieldError(fieldErrors[path])
}

function getCollectionFieldError(
  fieldErrors: CoinFieldErrors,
  collectionName: "rulers" | "mints" | "themes",
  index: number,
  fieldName: "rulerId" | "mintId" | "themeId"
) {
  return fieldErrors[`${collectionName}.${index}.${fieldName}`]
}

type AttributionCollectionName = "rulers" | "mints" | "themes"

function createEmptyReference(): CoinReferenceDraft {
  return {
    catalogueId: "",
    number: "",
  }
}

export function CoinForm(props: CoinFormProps) {
  const isEditMode = props.mode === "edit"
  const router = useRouter()
  const createCoin = useServerFn(createCoinAction)
  const updateCoin = useServerFn(updateCoinAction)
  const initialDraft = getInitialCoinDraft(props)
  const [draft, setDraft] = useState<CoinDraft>(() => initialDraft)
  const [fieldErrors, setFieldErrors] = useState<CoinFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const previousEditCoinIdRef = useRef(isEditMode ? props.coin.id : null)
  const isDirty = !areCoinDraftsEqual(draft, initialDraft)

  useBlocker({
    disabled: !isDirty || isPending,
    enableBeforeUnload: isDirty && !isPending,
    shouldBlockFn: () => {
      if (!isDirty || isPending) {
        return false
      }

      return !window.confirm(UNSAVED_CHANGES_WARNING)
    },
  })

  useEffect(() => {
    if (!isEditMode) {
      return
    }

    const nextCoinId = props.coin.id
    const previousCoinId = previousEditCoinIdRef.current

    if (previousCoinId === nextCoinId) {
      return
    }

    setDraft(initialDraft)
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage((currentSuccessMessage) =>
      getNextEditSuccessMessage({
        currentSuccessMessage,
        nextCoinId,
        previousCoinId,
      })
    )
    previousEditCoinIdRef.current = nextCoinId
  }, [initialDraft, isEditMode, isEditMode ? props.coin.id : null])

  function updateDraft<TFieldName extends keyof CoinDraft>(
    field: TFieldName,
    value: CoinDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateDraftCollection<TFieldName extends AttributionCollectionName>(
    field: TFieldName,
    updater: (items: CoinDraft[TFieldName]) => CoinDraft[TFieldName]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: updater(current[field]),
    }))
  }

  function replaceRulers(rulerIds: string[]) {
    updateDraftCollection("rulers", () =>
      rulerIds.length > 0
        ? rulerIds.map((rulerId) => ({ rulerId }))
        : [createEmptyRulerAttribution()]
    )
    setFieldErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([path]) => path !== "rulers" && !path.startsWith("rulers.")
        )
      )
    )
  }

  function replaceMints(mintIds: string[]) {
    updateDraftCollection("mints", () => mintIds.map((mintId) => ({ mintId })))
    setFieldErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([path]) => path !== "mints" && !path.startsWith("mints.")
        )
      )
    )
  }

  function replaceThemes(themeIds: string[]) {
    updateDraftCollection("themes", () =>
      themeIds.map((themeId) => ({ themeId }))
    )
    setFieldErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([path]) => path !== "themes" && !path.startsWith("themes.")
        )
      )
    )
  }

  function updateReference(
    index: number,
    field: keyof CoinReferenceDraft,
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      references: current.references.map((reference, referenceIndex) =>
        referenceIndex === index
          ? {
              ...reference,
              [field]: value,
            }
          : reference
      ),
    }))
  }

  function addReference() {
    setDraft((current) => ({
      ...current,
      references: [...current.references, createEmptyReference()],
    }))
  }

  function removeReference(index: number) {
    setDraft((current) => ({
      ...current,
      references: current.references.filter(
        (_reference, referenceIndex) => referenceIndex !== index
      ),
    }))
  }

  function updateFaceSurface(
    face: "obverse" | "reverse",
    field: keyof Omit<CoinFaceSurfaceDraft, "engraverIds">,
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      surfaces: {
        ...current.surfaces,
        [face]: {
          ...current.surfaces[face],
          [field]: value,
        },
      },
    }))
  }

  function updateEdgeSurface(field: keyof CoinEdgeSurfaceDraft, value: string) {
    setDraft((current) => ({
      ...current,
      surfaces: {
        ...current.surfaces,
        edge: {
          ...current.surfaces.edge,
          [field]: value,
        },
      },
    }))
  }

  function addFaceEngraver(face: "obverse" | "reverse") {
    setDraft((current) => ({
      ...current,
      surfaces: {
        ...current.surfaces,
        [face]: {
          ...current.surfaces[face],
          engraverIds: [...current.surfaces[face].engraverIds, ""],
        },
      },
    }))
  }

  function updateFaceEngraver(
    face: "obverse" | "reverse",
    index: number,
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      surfaces: {
        ...current.surfaces,
        [face]: {
          ...current.surfaces[face],
          engraverIds: current.surfaces[face].engraverIds.map(
            (engraverId, engraverIndex) =>
              engraverIndex === index ? value : engraverId
          ),
        },
      },
    }))
  }

  function removeFaceEngraver(face: "obverse" | "reverse", index: number) {
    setDraft((current) => ({
      ...current,
      surfaces: {
        ...current.surfaces,
        [face]: {
          ...current.surfaces[face],
          engraverIds: current.surfaces[face].engraverIds.filter(
            (_engraverId, engraverIndex) => engraverIndex !== index
          ),
        },
      },
    }))
  }

  function applyResult(result: CoinMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      setSuccessMessage(result.message)
      return result
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    setSuccessMessage(null)
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)

    const validationResult = validateDraft(
      props.mode === "edit" ? { id: props.coin.id, ...draft } : draft
    )

    if (validationResult !== null) {
      applyResult(validationResult)
      return
    }

    setIsPending(true)

    try {
      const result = isEditMode
        ? await updateCoin({
            data: {
              id: props.coin.id,
              ...draft,
            },
          })
        : await createCoin({
            data: draft,
          })

      const successResult = applyResult(result)

      if (!successResult) {
        return
      }

      if (!isEditMode) {
        window.location.assign(`/database/coins/${successResult.coinId}/edit`)
        return
      }

      await router.invalidate()
    } finally {
      setIsPending(false)
    }
  }

  function handleCancel() {
    void router.navigate({
      to: "/database/coins",
    })
  }

  const idPrefix = isEditMode ? "coin-edit" : "coin-create"
  const rulerErrors = [
    fieldErrors.rulers,
    ...draft.rulers.map((_, index) =>
      getCollectionFieldError(fieldErrors, "rulers", index, "rulerId")
    ),
  ].filter((message): message is string => message !== undefined)
  const mintErrors = [
    fieldErrors.mints,
    ...draft.mints.map((_, index) =>
      getCollectionFieldError(fieldErrors, "mints", index, "mintId")
    ),
  ].filter((message): message is string => message !== undefined)
  const themeErrors = [
    fieldErrors.themes,
    ...draft.themes.map((_, index) =>
      getCollectionFieldError(fieldErrors, "themes", index, "themeId")
    ),
  ].filter((message): message is string => message !== undefined)

  return (
    <form
      id={`database-${props.mode}-coin-form`}
      className="grid gap-6"
      onSubmit={handleSubmit}
    >
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
                  Coin Title
                </FieldLabel>
                <Input
                  id={`${idPrefix}-title`}
                  name="title"
                  value={draft.title}
                  onChange={(event) => updateDraft("title", event.target.value)}
                />
                {renderFieldError(fieldErrors.title)}
              </Field>
              <div className="grid gap-4 md:grid-cols-3">
                <CoinSelectField
                  error={fieldErrors.issuerId}
                  id={`${idPrefix}-issuer`}
                  label="Issuer"
                  name="issuerId"
                  onValueChange={(value) => updateDraft("issuerId", value)}
                  options={props.options.issuers}
                  placeholder="Select Issuer"
                  value={draft.issuerId}
                />
                <CoinSelectField
                  error={fieldErrors.distributionId}
                  id={`${idPrefix}-distribution`}
                  label="Distribution"
                  name="distributionId"
                  onValueChange={(value) =>
                    updateDraft("distributionId", value)
                  }
                  options={props.options.distributions}
                  placeholder="Select Distribution"
                  value={draft.distributionId}
                />
                <CoinSelectField
                  error={fieldErrors.compositionId}
                  id={`${idPrefix}-composition`}
                  label="Composition"
                  name="compositionId"
                  onValueChange={(value) => updateDraft("compositionId", value)}
                  options={props.options.compositions}
                  placeholder="Select Composition"
                  value={draft.compositionId}
                />
              </div>
              <CoinMultiComboboxField
                description="Search for and add every ruler attributed to this coin. The selected chip order determines the attribution order."
                errors={rulerErrors}
                id={`${idPrefix}-rulers-combobox`}
                label="Ruler Attributions"
                onValueChange={replaceRulers}
                options={props.options.rulers}
                placeholder="Search and add rulers"
                values={draft.rulers.map((ruler) => ruler.rulerId)}
              />
            </FieldGroup>
          </FieldSet>
        </Card>
      </FieldGroup>

      <Card>
        <FieldSet className="px-8">
          <FieldLegend>Denomination &amp; Legal Status</FieldLegend>
          <FieldDescription>
            Record the coin's Face Value and whether that denomination is known
            to remain legally monetized.
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
                options={props.options.currencies}
                placeholder="Select Currency"
                value={draft.currencyId}
              />
              <CoinInputField
                className="col-span-2"
                error={fieldErrors.faceValueText}
                id={`${idPrefix}-face-value-text`}
                label="Face Value text"
                name="faceValueText"
                onValueChange={(value) => updateDraft("faceValueText", value)}
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
                value={draft.faceValueNumericValue as string}
              />
            </div>
            <FieldSet>
              <FieldLegend variant="label">Demonetization Status</FieldLegend>
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
                className="grid gap-3 md:grid-cols-3"
              >
                <FieldLabel>
                  <Field orientation="horizontal">
                    <RadioGroupItem value="unknown" />
                    <FieldContent>
                      <FieldTitle>Unknown</FieldTitle>
                      <FieldDescription>
                        The coin's legal monetary status has not been
                        established.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
                <FieldLabel>
                  <Field orientation="horizontal">
                    <RadioGroupItem value="not-demonetized" />
                    <FieldContent>
                      <FieldTitle>Not demonetized</FieldTitle>
                      <FieldDescription>
                        The coin is known to remain legally monetized.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
                <FieldLabel>
                  <Field orientation="horizontal">
                    <RadioGroupItem value="demonetized" />
                    <FieldContent>
                      <FieldTitle>Demonetized</FieldTitle>
                      <FieldDescription>
                        The coin is known to no longer be legally monetized.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              </RadioGroup>
              <FieldGroup>
                {renderFieldError(fieldErrors.demonetizationStatus)}
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </FieldSet>
      </Card>

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
                ["orientationId", "Orientation", props.options.orientations],
                ["shapeId", "Shape", props.options.shapes],
                ["edgeId", "Edge", props.options.edges],
                ["rimId", "Rim", props.options.rims],
              ] as const
            ).map(([fieldName, label, options]) => (
              <CoinSelectField
                key={fieldName}
                error={fieldErrors[fieldName]}
                id={`${idPrefix}-${fieldName}`}
                label={label}
                name={fieldName}
                onValueChange={(value) =>
                  updateDraft(fieldName, value as CoinDraft[typeof fieldName])
                }
                options={options}
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
                options={props.options.techniques}
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
              options={props.options.mints}
              placeholder="Search and add mints"
              values={draft.mints.map((mint) => mint.mintId)}
            />
          </FieldGroup>
        </FieldSet>
      </Card>

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
              options={props.options.themes}
              placeholder="Search and add themes"
              values={draft.themes.map((theme) => theme.themeId)}
            />
          </FieldGroup>
        </FieldSet>
      </Card>

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
                onChange={(event) =>
                  updateDraft("comments", event.target.value)
                }
                className="min-h-28 rounded border px-3 py-2"
              />
              {renderFieldError(fieldErrors.comments)}
            </label>
            <section className="grid gap-4 rounded border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Catalogue References
                  </h2>
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
                    options={props.options.catalogues}
                    placeholder="Select Catalogue"
                    value={reference.catalogueId}
                  />
                  <CoinInputField
                    error={fieldErrors[`references.${index}.number`]}
                    id={`${idPrefix}-reference-number-${index}`}
                    label="Reference Number"
                    onValueChange={(value) =>
                      updateReference(index, "number", value)
                    }
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

      <Card>
        <FieldSet className="px-8">
          <FieldLegend>Design &amp; Imagery</FieldLegend>
          <FieldDescription>
            Document the Obverse, Reverse, and Edge Surface through
            descriptions, lettering, images, and face-specific engraver
            attributions.
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
                      Description, lettering, image URLs, and face-specific
                      engravers.
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
                  <label className="grid gap-1 text-sm">
                    <span>Description</span>
                    <textarea
                      value={surface.description as string}
                      onChange={(event) =>
                        updateFaceSurface(
                          face,
                          "description",
                          event.target.value
                        )
                      }
                      className="min-h-24 rounded border px-3 py-2"
                    />
                    {renderPathFieldError(
                      fieldErrors,
                      `surfaces.${face}.description`
                    )}
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span>Lettering</span>
                    <textarea
                      value={surface.lettering as string}
                      onChange={(event) =>
                        updateFaceSurface(face, "lettering", event.target.value)
                      }
                      className="min-h-24 rounded border px-3 py-2"
                    />
                    {renderPathFieldError(
                      fieldErrors,
                      `surfaces.${face}.lettering`
                    )}
                  </label>
                  <CoinInputField
                    error={fieldErrors[`surfaces.${face}.thumbnailUrl`]}
                    id={`${idPrefix}-${face}-thumbnail-url`}
                    label="Surface Thumbnail URL"
                    onValueChange={(value) =>
                      updateFaceSurface(face, "thumbnailUrl", value)
                    }
                    type="url"
                    value={surface.thumbnailUrl as string}
                  />
                  <CoinInputField
                    error={fieldErrors[`surfaces.${face}.imageUrl`]}
                    id={`${idPrefix}-${face}-image-url`}
                    label="Surface Image URL"
                    onValueChange={(value) =>
                      updateFaceSurface(face, "imageUrl", value)
                    }
                    type="url"
                    value={surface.imageUrl as string}
                  />
                </div>

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
                        options={props.options.engravers}
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
                  Description, lettering, and image URLs. Edge Surface does not
                  accept Engraver Attributions.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span>Description</span>
                  <textarea
                    value={draft.surfaces.edge.description as string}
                    onChange={(event) =>
                      updateEdgeSurface("description", event.target.value)
                    }
                    className="min-h-24 rounded border px-3 py-2"
                  />
                  {renderPathFieldError(
                    fieldErrors,
                    "surfaces.edge.description"
                  )}
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Lettering</span>
                  <textarea
                    value={draft.surfaces.edge.lettering as string}
                    onChange={(event) =>
                      updateEdgeSurface("lettering", event.target.value)
                    }
                    className="min-h-24 rounded border px-3 py-2"
                  />
                  {renderPathFieldError(fieldErrors, "surfaces.edge.lettering")}
                </label>
                <CoinInputField
                  error={fieldErrors["surfaces.edge.thumbnailUrl"]}
                  id={`${idPrefix}-edge-thumbnail-url`}
                  label="Surface Thumbnail URL"
                  onValueChange={(value) =>
                    updateEdgeSurface("thumbnailUrl", value)
                  }
                  type="url"
                  value={draft.surfaces.edge.thumbnailUrl as string}
                />
                <CoinInputField
                  error={fieldErrors["surfaces.edge.imageUrl"]}
                  id={`${idPrefix}-edge-image-url`}
                  label="Surface Image URL"
                  onValueChange={(value) =>
                    updateEdgeSurface("imageUrl", value)
                  }
                  type="url"
                  value={draft.surfaces.edge.imageUrl as string}
                />
              </div>
            </section>
          </FieldGroup>
        </FieldSet>
      </Card>

      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}
      {successMessage ? (
        <p className="text-sm text-emerald-700">{successMessage}</p>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="rounded border px-3 py-2 text-sm"
        >
          Cancel
        </button>
        <SubmitButton
          type="submit"
          disabled={isPending || !hasRequiredCoinDraftFields(draft)}
          isSubmitting={isPending}
        >
          {props.mode === "create" ? "Create Coin" : "Save"}
        </SubmitButton>
      </div>
    </form>
  )
}
