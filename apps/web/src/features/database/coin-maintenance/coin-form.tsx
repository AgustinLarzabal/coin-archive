import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
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
  createCoinDraft,
  createEmptyRulerAttribution,
  EMPTY_COIN_DRAFT,
  getNextEditSuccessMessage,
  hasRequiredCoinDraftFields,
  type CoinFormOptions,
} from "./coin-form.shared"

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
    <option key={option.id} value={option.id}>
      {createOptionLabel(option)}
    </option>
  ))
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

function moveItem<TItem>(items: TItem[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction

  if (nextIndex < 0 || nextIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [movedItem] = nextItems.splice(index, 1)
  nextItems.splice(nextIndex, 0, movedItem)
  return nextItems
}

function createEmptyReference(): CoinReferenceDraft {
  return {
    catalogueId: "",
    number: "",
  }
}

export function CoinForm(props: CoinFormProps) {
  const router = useRouter()
  const createCoin = useServerFn(createCoinAction)
  const updateCoin = useServerFn(updateCoinAction)
  const [draft, setDraft] = useState<CoinDraft>(
    props.mode === "edit" ? createCoinDraft(props.coin) : EMPTY_COIN_DRAFT
  )
  const [fieldErrors, setFieldErrors] = useState<CoinFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const previousEditCoinIdRef = useRef(
    props.mode === "edit" ? props.coin.id : null
  )

  useEffect(() => {
    if (props.mode === "edit") {
      const nextCoinId = props.coin.id
      const previousCoinId = previousEditCoinIdRef.current

      setDraft(createCoinDraft(props.coin))
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
    }
  }, [props])

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

  function addRuler() {
    updateDraftCollection("rulers", (rulers) => [
      ...rulers,
      createEmptyRulerAttribution(),
    ])
  }

  function updateRuler(index: number, rulerId: string) {
    updateDraftCollection("rulers", (rulers) =>
      rulers.map((ruler, currentIndex) =>
        currentIndex === index ? { rulerId } : ruler
      )
    )
  }

  function moveRuler(index: number, direction: -1 | 1) {
    updateDraftCollection("rulers", (rulers) =>
      moveItem(rulers, index, direction)
    )
  }

  function removeRuler(index: number) {
    updateDraftCollection("rulers", (rulers) => {
      if (rulers.length === 1) {
        return [createEmptyRulerAttribution()]
      }

      return rulers.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  function addMint() {
    updateDraftCollection("mints", (mints) => [...mints, { mintId: "" }])
  }

  function updateMint(index: number, mintId: string) {
    updateDraftCollection("mints", (mints) =>
      mints.map((mint, currentIndex) =>
        currentIndex === index ? { mintId } : mint
      )
    )
  }

  function removeMint(index: number) {
    updateDraftCollection("mints", (mints) =>
      mints.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  function addTheme() {
    updateDraftCollection("themes", (themes) => [...themes, { themeId: "" }])
  }

  function updateTheme(index: number, themeId: string) {
    updateDraftCollection("themes", (themes) =>
      themes.map((theme, currentIndex) =>
        currentIndex === index ? { themeId } : theme
      )
    )
  }

  function removeTheme(index: number) {
    updateDraftCollection("themes", (themes) =>
      themes.filter((_, currentIndex) => currentIndex !== index)
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

  function updateEdgeSurface(
    field: keyof CoinEdgeSurfaceDraft,
    value: string
  ) {
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
      const result =
        props.mode === "edit"
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

      if (props.mode === "create") {
        window.location.assign(`/database/coins/${successResult.coinId}/edit`)
        return
      }

      await router.invalidate()
    } finally {
      setIsPending(false)
    }
  }

  const idPrefix = props.mode === "edit" ? "coin-edit" : "coin-create"

  return (
    <form
      id={`database-${props.mode}-coin-form`}
      className="grid gap-6"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span>Coin Title</span>
          <input
            name="title"
            value={draft.title}
            onChange={(event) => updateDraft("title", event.target.value)}
            className="rounded border px-3 py-2"
          />
          {renderFieldError(fieldErrors.title)}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Issuer</span>
          <select
            name="issuerId"
            value={draft.issuerId}
            onChange={(event) => updateDraft("issuerId", event.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Select Issuer</option>
            {renderSelectOptions(props.options.issuers)}
          </select>
          {renderFieldError(fieldErrors.issuerId)}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Distribution</span>
          <select
            name="distributionId"
            value={draft.distributionId}
            onChange={(event) =>
              updateDraft("distributionId", event.target.value)
            }
            className="rounded border px-3 py-2"
          >
            <option value="">Select Distribution</option>
            {renderSelectOptions(props.options.distributions)}
          </select>
          {renderFieldError(fieldErrors.distributionId)}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Composition</span>
          <select
            name="compositionId"
            value={draft.compositionId}
            onChange={(event) =>
              updateDraft("compositionId", event.target.value)
            }
            className="rounded border px-3 py-2"
          >
            <option value="">Select Composition</option>
            {renderSelectOptions(props.options.compositions)}
          </select>
          {renderFieldError(fieldErrors.compositionId)}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Face Value text</span>
          <input
            name="faceValueText"
            value={draft.faceValueText}
            onChange={(event) =>
              updateDraft("faceValueText", event.target.value)
            }
            className="rounded border px-3 py-2"
          />
          {renderFieldError(fieldErrors.faceValueText)}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Face Value numeric value</span>
          <input
            name="faceValueNumericValue"
            value={draft.faceValueNumericValue as string}
            onChange={(event) =>
              updateDraft("faceValueNumericValue", event.target.value)
            }
            className="rounded border px-3 py-2"
          />
          {renderFieldError(fieldErrors.faceValueNumericValue)}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Currency</span>
          <select
            name="currencyId"
            value={draft.currencyId}
            onChange={(event) => updateDraft("currencyId", event.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Select Currency</option>
            {renderSelectOptions(props.options.currencies)}
          </select>
          {renderFieldError(fieldErrors.currencyId)}
        </label>
        {(
          [
            ["orientationId", "Orientation", props.options.orientations],
            ["shapeId", "Shape", props.options.shapes],
            ["techniqueId", "Minting Technique", props.options.techniques],
            ["edgeId", "Edge", props.options.edges],
            ["rimId", "Rim", props.options.rims],
          ] as const
        ).map(([fieldName, label, options]) => (
          <label key={fieldName} className="grid gap-1 text-sm">
            <span>{label}</span>
            <select
              name={fieldName}
              value={draft[fieldName] as string}
              onChange={(event) =>
                updateDraft(fieldName, event.target.value as CoinDraft[typeof fieldName])
              }
              className="rounded border px-3 py-2"
            >
              <option value="">Unknown</option>
              {renderSelectOptions(options)}
            </select>
            {renderFieldError(fieldErrors[fieldName])}
          </label>
        ))}
        {(
          [
            ["weight", "Weight"],
            ["diameter", "Diameter"],
            ["thickness", "Thickness"],
            ["mintage", "Mintage"],
            ["minYear", "Earliest Issue Year"],
            ["maxYear", "Latest Issue Year"],
          ] as const
        ).map(([fieldName, label]) => (
          <label key={fieldName} className="grid gap-1 text-sm">
            <span>{label}</span>
            <input
              id={`${idPrefix}-${fieldName}`}
              name={fieldName}
              value={draft[fieldName] as string}
              onChange={(event) =>
                updateDraft(fieldName, event.target.value as CoinDraft[typeof fieldName])
              }
              className="rounded border px-3 py-2"
            />
            {renderFieldError(fieldErrors[fieldName])}
          </label>
        ))}
        <fieldset className="grid gap-3 text-sm md:col-span-2">
          <legend>Ruler Attributions</legend>
          <div className="grid gap-3">
            {draft.rulers.map((ruler, index) => (
              <div
                key={`ruler-${index}`}
                className="grid gap-2 rounded border p-3 md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="grid gap-1">
                  <span>Ruler {index + 1}</span>
                  <select
                    name={`rulers.${index}.rulerId`}
                    value={ruler.rulerId}
                    onChange={(event) => updateRuler(index, event.target.value)}
                    className="rounded border px-3 py-2"
                  >
                    <option value="">Select Ruler</option>
                    {renderSelectOptions(props.options.rulers)}
                  </select>
                  {renderFieldError(
                    getCollectionFieldError(
                      fieldErrors,
                      "rulers",
                      index,
                      "rulerId"
                    )
                  )}
                </div>
                <div className="flex gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => moveRuler(index, -1)}
                    disabled={index === 0}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRuler(index, 1)}
                    disabled={index === draft.rulers.length - 1}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRuler(index)}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          {renderFieldError(fieldErrors.rulers)}
          <div>
            <button
              type="button"
              onClick={addRuler}
              className="rounded border px-3 py-2 text-sm"
            >
              Add Ruler Attribution
            </button>
          </div>
        </fieldset>
        <fieldset className="grid gap-3 text-sm md:col-span-2">
          <legend>Mint Attributions</legend>
          {draft.mints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Mint Attributions.
            </p>
          ) : (
            <div className="grid gap-3">
              {draft.mints.map((mint, index) => (
                <div
                  key={`mint-${index}`}
                  className="grid gap-2 rounded border p-3 md:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="grid gap-1">
                    <span>Mint {index + 1}</span>
                    <select
                      name={`mints.${index}.mintId`}
                      value={mint.mintId}
                      onChange={(event) =>
                        updateMint(index, event.target.value)
                      }
                      className="rounded border px-3 py-2"
                    >
                      <option value="">Select Mint</option>
                      {renderSelectOptions(props.options.mints)}
                    </select>
                    {renderFieldError(
                      getCollectionFieldError(
                        fieldErrors,
                        "mints",
                        index,
                        "mintId"
                      )
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => removeMint(index)}
                      className="rounded border px-3 py-2 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {renderFieldError(fieldErrors.mints)}
          <div>
            <button
              type="button"
              onClick={addMint}
              className="rounded border px-3 py-2 text-sm"
            >
              Add Mint Attribution
            </button>
          </div>
        </fieldset>
        <fieldset className="grid gap-3 text-sm md:col-span-2">
          <legend>Theme Attributions</legend>
          {draft.themes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Theme Attributions.
            </p>
          ) : (
            <div className="grid gap-3">
              {draft.themes.map((theme, index) => (
                <div
                  key={`theme-${index}`}
                  className="grid gap-2 rounded border p-3 md:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="grid gap-1">
                    <span>Theme {index + 1}</span>
                    <select
                      name={`themes.${index}.themeId`}
                      value={theme.themeId}
                      onChange={(event) =>
                        updateTheme(index, event.target.value)
                      }
                      className="rounded border px-3 py-2"
                    >
                      <option value="">Select Theme</option>
                      {renderSelectOptions(props.options.themes)}
                    </select>
                    {renderFieldError(
                      getCollectionFieldError(
                        fieldErrors,
                        "themes",
                        index,
                        "themeId"
                      )
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => removeTheme(index)}
                      className="rounded border px-3 py-2 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {renderFieldError(fieldErrors.themes)}
          <div>
            <button
              type="button"
              onClick={addTheme}
              className="rounded border px-3 py-2 text-sm"
            >
              Add Theme Attribution
            </button>
          </div>
        </fieldset>
      </div>

      <label className="grid gap-1 text-sm">
        <span>Coin Comment</span>
        <textarea
          name="comments"
          value={draft.comments as string}
          onChange={(event) => updateDraft("comments", event.target.value)}
          className="min-h-28 rounded border px-3 py-2"
        />
        {renderFieldError(fieldErrors.comments)}
      </label>

      <fieldset className="grid gap-2 text-sm">
        <legend>Demonetization Status</legend>
        <label>
          <input
            type="radio"
            name="demonetizationStatus"
            checked={draft.demonetizationStatus === "unknown"}
            onChange={() => updateDraft("demonetizationStatus", "unknown")}
          />{" "}
          Unknown
        </label>
        <label>
          <input
            type="radio"
            name="demonetizationStatus"
            checked={draft.demonetizationStatus === "not-demonetized"}
            onChange={() =>
              updateDraft("demonetizationStatus", "not-demonetized")
            }
          />{" "}
          Not demonetized
        </label>
        <label>
          <input
            type="radio"
            name="demonetizationStatus"
            checked={draft.demonetizationStatus === "demonetized"}
            onChange={() =>
              updateDraft("demonetizationStatus", "demonetized")
            }
          />{" "}
          Demonetized
        </label>
        {renderFieldError(fieldErrors.demonetizationStatus)}
      </fieldset>

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
            <label className="grid gap-1 text-sm">
              <span>Catalogue</span>
              <select
                value={reference.catalogueId}
                onChange={(event) =>
                  updateReference(index, "catalogueId", event.target.value)
                }
                className="rounded border px-3 py-2"
              >
                <option value="">Select Catalogue</option>
                {renderSelectOptions(props.options.catalogues)}
              </select>
              {renderPathFieldError(
                fieldErrors,
                `references.${index}.catalogueId`
              )}
            </label>
            <label className="grid gap-1 text-sm">
              <span>Reference Number</span>
              <input
                value={reference.number}
                onChange={(event) =>
                  updateReference(index, "number", event.target.value)
                }
                className="rounded border px-3 py-2"
              />
              {renderPathFieldError(fieldErrors, `references.${index}.number`)}
            </label>
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
                Description, lettering, image URLs, and face-specific engravers.
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
                  updateFaceSurface(face, "description", event.target.value)
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
              {renderPathFieldError(fieldErrors, `surfaces.${face}.lettering`)}
            </label>
            <label className="grid gap-1 text-sm">
              <span>Surface Thumbnail URL</span>
              <input
                value={surface.thumbnailUrl as string}
                onChange={(event) =>
                  updateFaceSurface(face, "thumbnailUrl", event.target.value)
                }
                className="rounded border px-3 py-2"
              />
              {renderPathFieldError(
                fieldErrors,
                `surfaces.${face}.thumbnailUrl`
              )}
            </label>
            <label className="grid gap-1 text-sm">
              <span>Surface Image URL</span>
              <input
                value={surface.imageUrl as string}
                onChange={(event) =>
                  updateFaceSurface(face, "imageUrl", event.target.value)
                }
                className="rounded border px-3 py-2"
              />
              {renderPathFieldError(fieldErrors, `surfaces.${face}.imageUrl`)}
            </label>
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
                <label className="grid gap-1 text-sm">
                  <span>Engraver</span>
                  <select
                    value={engraverId}
                    onChange={(event) =>
                      updateFaceEngraver(face, index, event.target.value)
                    }
                    className="rounded border px-3 py-2"
                  >
                    <option value="">Select Engraver</option>
                    {renderSelectOptions(props.options.engravers)}
                  </select>
                  {renderPathFieldError(
                    fieldErrors,
                    `surfaces.${face}.engraverIds.${index}`
                  )}
                </label>
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
            Description, lettering, and image URLs. Edge Surface does not accept
            Engraver Attributions.
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
            {renderPathFieldError(fieldErrors, "surfaces.edge.description")}
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
          <label className="grid gap-1 text-sm">
            <span>Surface Thumbnail URL</span>
            <input
              value={draft.surfaces.edge.thumbnailUrl as string}
              onChange={(event) =>
                updateEdgeSurface("thumbnailUrl", event.target.value)
              }
              className="rounded border px-3 py-2"
            />
            {renderPathFieldError(fieldErrors, "surfaces.edge.thumbnailUrl")}
          </label>
          <label className="grid gap-1 text-sm">
            <span>Surface Image URL</span>
            <input
              value={draft.surfaces.edge.imageUrl as string}
              onChange={(event) =>
                updateEdgeSurface("imageUrl", event.target.value)
              }
              className="rounded border px-3 py-2"
            />
            {renderPathFieldError(fieldErrors, "surfaces.edge.imageUrl")}
          </label>
        </div>
      </section>

      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}
      {successMessage ? (
        <p className="text-sm text-emerald-700">{successMessage}</p>
      ) : null}

      <div className="flex justify-end">
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
