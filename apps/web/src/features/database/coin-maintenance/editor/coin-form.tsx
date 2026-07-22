import { useEffect, useRef, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useBlocker, useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CoinMaintenanceRecord } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  CoinDraft,
  CoinEdgeSurfaceDraft,
  CoinFaceSurfaceDraft,
  CoinFieldErrors,
  CoinMutationResult,
  CoinReferenceDraft,
} from "../actions"
import {
  coinDraftSchema,
  getCoinFieldErrors,
  submitCreateCoin,
  submitUpdateCoin,
  authorizeSurfaceImageUpload,
  removeSurfaceImageUpload,
} from "../actions"
import {
  createEmptyRulerAttribution,
  getInitialCoinDraft,
  getNextEditSuccessMessage,
  hasRequiredCoinDraftFields,
} from "./coin-form.shared"
import type { CoinFormOptions } from "./coin-form.shared"
import { CatalogueNotesReferencesSection } from "./sections/catalogue-notes-references-section"
import { DenominationLegalStatusSection } from "./sections/denomination-legal-status-section"
import { DesignImagerySection } from "./sections/design-imagery-section"
import { IdentityClassificationSection } from "./sections/identity-classification-section"
import { PhysicalCharacteristicsSection } from "./sections/physical-characteristics-section"
import { ProductionChronologySection } from "./sections/production-chronology-section"
import { ThemesSection } from "./sections/themes-section"
import { FieldError } from "@workspace/ui/components/field"

const UNSAVED_CHANGES_WARNING =
  "You have unsaved changes. Are you sure you want to leave this page?"

type CoinFormProps =
  | { mode: "create"; options: CoinFormOptions }
  | { coin: CoinMaintenanceRecord; mode: "edit"; options: CoinFormOptions }

const createCoinAction = createServerFn({ method: "POST" })
  .inputValidator((data: CoinDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    return submitCreateCoin(session?.user ?? null, data)
  })

const updateCoinAction = createServerFn({ method: "POST" })
  .inputValidator((data: CoinDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    return submitUpdateCoin(session?.user ?? null, data)
  })

const authorizeSurfaceImageUploadAction = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      surface: "obverse" | "reverse" | "edge"
      contentType: string
      contentLength: number
    }) => data
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    return authorizeSurfaceImageUpload(session?.user ?? null, data)
  })

const removeSurfaceImageUploadAction = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { surface: "obverse" | "reverse" | "edge"; reference: string }) =>
      data
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    return removeSurfaceImageUpload(session?.user ?? null, data)
  })

function getCoinDraftValidationErrors(draft: CoinDraft): CoinFieldErrors {
  const parsedDraft = coinDraftSchema.safeParse(draft)

  return parsedDraft.success ? {} : getCoinFieldErrors(parsedDraft.error.issues)
}

function getCollectionFieldError(
  fieldErrors: CoinFieldErrors,
  collectionName: "rulers" | "mints" | "themes",
  index: number,
  fieldName: "rulerId" | "mintId" | "themeId"
) {
  return fieldErrors[`${collectionName}.${index}.${fieldName}`]
}

function createEmptyReference(): CoinReferenceDraft {
  return { catalogueId: "", number: "" }
}

function CoinFormNavigationBlocker({
  isDirty,
  isPending,
}: {
  isDirty: boolean
  isPending: boolean
}) {
  useBlocker({
    disabled: !isDirty || isPending,
    enableBeforeUnload: isDirty && !isPending,
    shouldBlockFn: () =>
      !isDirty || isPending || !window.confirm(UNSAVED_CHANGES_WARNING),
  })

  return null
}

export function CoinForm(props: CoinFormProps) {
  const isEditMode = props.mode === "edit"
  const router = useRouter()
  const createCoin = useServerFn(createCoinAction)
  const updateCoin = useServerFn(updateCoinAction)
  const authorizeImageUpload = useServerFn(authorizeSurfaceImageUploadAction)
  const removeImageUpload = useServerFn(removeSurfaceImageUploadAction)
  const initialDraft = getInitialCoinDraft(props)
  const [fieldErrors, setFieldErrors] = useState<CoinFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [pendingSurfaceUploads, setPendingSurfaceUploads] = useState<
    Partial<Record<"obverse" | "reverse" | "edge", boolean>>
  >({})
  const previousEditCoinIdRef = useRef(isEditMode ? props.coin.id : null)

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

  const form = useForm({
    defaultValues: initialDraft,
    validators: {
      onSubmit: ({ value }) => {
        const errors = getCoinDraftValidationErrors(value)
        return Object.keys(errors).length > 0 ? { fields: errors } : undefined
      },
    },
    onSubmitInvalid: ({ value }) => {
      setFieldErrors(getCoinDraftValidationErrors(value))
    },
    onSubmit: async ({ value }) => {
      const result = isEditMode
        ? await updateCoin({ data: { id: props.coin.id, ...value } })
        : await createCoin({ data: value })
      const successResult = applyResult(result)

      if (!successResult) return
      if (!isEditMode) {
        window.location.assign(`/database/coins/${successResult.coinId}/edit`)
        return
      }

      await router.invalidate()
    },
  })

  useEffect(() => {
    if (!isEditMode) return

    const nextCoinId = props.coin.id
    const previousCoinId = previousEditCoinIdRef.current
    if (previousCoinId === nextCoinId) return

    form.reset(initialDraft)
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
  }, [form, initialDraft, isEditMode, isEditMode ? props.coin.id : null])

  function updateDraft<TFieldName extends keyof CoinDraft>(
    field: TFieldName,
    value: CoinDraft[TFieldName]
  ) {
    form.setFieldValue(field, value as never)
  }

  function clearCollectionErrors(
    collectionName: "rulers" | "mints" | "themes"
  ) {
    setFieldErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([path]) =>
            path !== collectionName && !path.startsWith(`${collectionName}.`)
        )
      )
    )
  }

  function replaceRulers(rulerIds: string[]) {
    form.setFieldValue("rulers", () =>
      rulerIds.length > 0
        ? rulerIds.map((rulerId) => ({ rulerId }))
        : [createEmptyRulerAttribution()]
    )
    clearCollectionErrors("rulers")
  }

  function replaceMints(mintIds: string[]) {
    form.setFieldValue("mints", () => mintIds.map((mintId) => ({ mintId })))
    clearCollectionErrors("mints")
  }

  function replaceThemes(themeIds: string[]) {
    form.setFieldValue("themes", () => themeIds.map((themeId) => ({ themeId })))
    clearCollectionErrors("themes")
  }

  function updateReference(
    index: number,
    field: keyof CoinReferenceDraft,
    value: string
  ) {
    form.setFieldValue("references", (current) =>
      current.map((reference, referenceIndex) =>
        referenceIndex === index ? { ...reference, [field]: value } : reference
      )
    )
  }

  function addReference() {
    form.pushFieldValue("references", createEmptyReference())
  }

  function removeReference(index: number) {
    form.setFieldValue("references", (current) =>
      current.filter((_reference, referenceIndex) => referenceIndex !== index)
    )
  }

  function updateFaceSurface(
    face: "obverse" | "reverse",
    field: keyof Omit<CoinFaceSurfaceDraft, "engraverIds">,
    value: string
  ) {
    form.setFieldValue("surfaces", (current) => ({
      ...current,
      [face]: { ...current[face], [field]: value },
    }))
  }

  function updateEdgeSurface(field: keyof CoinEdgeSurfaceDraft, value: string) {
    form.setFieldValue("surfaces", (current) => ({
      ...current,
      edge: { ...current.edge, [field]: value },
    }))
  }

  function updateSurfaceImageUploadReference(
    surface: "obverse" | "reverse" | "edge",
    reference: string
  ) {
    form.setFieldValue("surfaces", (current) => ({
      ...current,
      [surface]: { ...current[surface], imageUploadReference: reference },
    }))
  }

  function removePersistedSurfaceImage(
    surface: "obverse" | "reverse" | "edge"
  ) {
    form.setFieldValue("surfaces", (current) => ({
      ...current,
      [surface]: { ...current[surface], imageUrl: "" },
    }))
  }

  function setSurfaceImagePending(
    surface: "obverse" | "reverse" | "edge",
    isPending: boolean
  ) {
    setPendingSurfaceUploads((current) => ({
      ...current,
      [surface]: isPending,
    }))
  }

  function updateFaceEngravers(
    face: "obverse" | "reverse",
    engraverIds: string[]
  ) {
    form.setFieldValue("surfaces", (current) => ({
      ...current,
      [face]: {
        ...current[face],
        engraverIds,
      },
    }))
  }

  const idPrefix = isEditMode ? "coin-edit" : "coin-create"

  return (
    <form
      id={`database-${props.mode}-coin-form`}
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        setFieldErrors({})
        setFormError(null)
        setSuccessMessage(null)
        void form.handleSubmit()
      }}
    >
      <form.Subscribe selector={(state) => state}>
        {(state) => {
          const draft = state.values
          const commonProps = {
            draft,
            fieldErrors,
            idPrefix,
            options: props.options,
            updateDraft,
          }
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
            <>
              <CoinFormNavigationBlocker
                isDirty={state.isDirty}
                isPending={state.isSubmitting}
              />
              <IdentityClassificationSection
                {...commonProps}
                rulerErrors={rulerErrors}
                replaceRulers={replaceRulers}
              />
              <DenominationLegalStatusSection {...commonProps} />
              <PhysicalCharacteristicsSection {...commonProps} />
              <ProductionChronologySection
                {...commonProps}
                mintErrors={mintErrors}
                replaceMints={replaceMints}
              />
              <ThemesSection
                draft={draft}
                idPrefix={idPrefix}
                options={props.options}
                themeErrors={themeErrors}
                replaceThemes={replaceThemes}
              />
              <CatalogueNotesReferencesSection
                {...commonProps}
                addReference={addReference}
                removeReference={removeReference}
                updateReference={updateReference}
              />
              <DesignImagerySection
                draft={draft}
                fieldErrors={fieldErrors}
                idPrefix={idPrefix}
                options={props.options}
                updateEdgeSurface={updateEdgeSurface}
                updateFaceEngravers={updateFaceEngravers}
                updateFaceSurface={updateFaceSurface}
                onSurfaceImagePendingChange={setSurfaceImagePending}
                removePersistedSurfaceImage={removePersistedSurfaceImage}
                updateSurfaceImageUploadReference={
                  updateSurfaceImageUploadReference
                }
                authorizeSurfaceImageUpload={({
                  surface,
                  contentType,
                  contentLength,
                }) =>
                  authorizeImageUpload({
                    data: { surface, contentType, contentLength },
                  })
                }
                removeSurfaceImageUpload={({ surface, reference }) =>
                  removeImageUpload({ data: { surface, reference } })
                }
              />
              {formError ? <FieldError>{formError}</FieldError> : null}
              {successMessage ? (
                <p className="text-sm text-emerald-700">{successMessage}</p>
              ) : null}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() =>
                    void router.navigate({ to: "/database/coins" })
                  }
                  disabled={state.isSubmitting}
                  variant="outline"
                >
                  Cancel
                </Button>
                <SubmitButton
                  type="submit"
                  disabled={
                    state.isSubmitting ||
                    !hasRequiredCoinDraftFields(draft) ||
                    Object.values(pendingSurfaceUploads).some(Boolean)
                  }
                  isSubmitting={state.isSubmitting}
                >
                  {props.mode === "create" ? "Create Coin" : "Save"}
                </SubmitButton>
              </div>
            </>
          )
        }}
      </form.Subscribe>
    </form>
  )
}
