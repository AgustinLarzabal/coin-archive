import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type {
  CoinMaintenanceRecord,
  CompositionOption,
  CurrencyOption,
  DistributionOption,
  EdgeOption,
  IssuerOption,
  OrientationOption,
  RimOption,
  RulerOption,
  ShapeOption,
  TechniqueOption,
} from "@workspace/db"
import { SubmitButton } from "@workspace/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type { CoinFieldErrors, CoinMutationResult } from "./actions"
import {
  coinDraftSchema,
  getCoinFieldErrors,
  submitCreateCoin,
  submitUpdateCoin,
  updateCoinInputSchema,
} from "./actions"
import {
  createCoinDraft,
  EMPTY_COIN_DRAFT,
  hasRequiredCoinDraftFields,
} from "./coin-form.shared"
import type { CoinDraft } from "./actions"

type CoinFormOptions = {
  compositions: CompositionOption[]
  currencies: CurrencyOption[]
  distributions: DistributionOption[]
  edges: EdgeOption[]
  issuers: IssuerOption[]
  orientations: OrientationOption[]
  rims: RimOption[]
  rulers: RulerOption[]
  shapes: ShapeOption[]
  techniques: TechniqueOption[]
}

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

function createOptionLabel(option: { code: string; name: string }) {
  return `${option.name} (${option.code})`
}

function renderSelectOptions(options: Array<{ id: string; code: string; name: string }>) {
  return options.map((option) => (
    <option key={option.id} value={option.id}>
      {createOptionLabel(option)}
    </option>
  ))
}

function validateCreateDraft(draft: CoinDraft): CoinMutationResult | null {
  const parsedInput = coinDraftSchema.safeParse(draft)

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getCoinFieldErrors(parsedInput.error.issues),
  }
}

function validateEditDraft(
  coinId: string,
  draft: CoinDraft
): CoinMutationResult | null {
  const parsedInput = updateCoinInputSchema.safeParse({
    id: coinId,
    ...draft,
  })

  if (parsedInput.success) {
    return null
  }

  return {
    status: "error",
    fieldErrors: getCoinFieldErrors(parsedInput.error.issues),
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

  useEffect(() => {
    if (props.mode === "edit") {
      setDraft(createCoinDraft(props.coin))
      setFieldErrors({})
      setFormError(null)
      setSuccessMessage(null)
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

    const validationResult =
      props.mode === "edit"
        ? validateEditDraft(props.coin.id, draft)
        : validateCreateDraft(draft)

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
          {fieldErrors.title ? <span className="text-sm text-destructive">{fieldErrors.title}</span> : null}
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
        </label>
        <label className="grid gap-1 text-sm">
          <span>Ruler Attribution</span>
          <select
            name="rulerId"
            value={draft.rulerId}
            onChange={(event) => updateDraft("rulerId", event.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Select Ruler</option>
            {renderSelectOptions(props.options.rulers)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Distribution</span>
          <select
            name="distributionId"
            value={draft.distributionId}
            onChange={(event) => updateDraft("distributionId", event.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Select Distribution</option>
            {renderSelectOptions(props.options.distributions)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Composition</span>
          <select
            name="compositionId"
            value={draft.compositionId}
            onChange={(event) => updateDraft("compositionId", event.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Select Composition</option>
            {renderSelectOptions(props.options.compositions)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Face Value text</span>
          <input
            name="faceValueText"
            value={draft.faceValueText}
            onChange={(event) => updateDraft("faceValueText", event.target.value)}
            className="rounded border px-3 py-2"
          />
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
          {fieldErrors.faceValueNumericValue ? (
            <span className="text-sm text-destructive">
              {fieldErrors.faceValueNumericValue}
            </span>
          ) : null}
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
            {fieldErrors[fieldName] ? (
              <span className="text-sm text-destructive">
                {fieldErrors[fieldName]}
              </span>
            ) : null}
          </label>
        ))}
        <label className="grid gap-1 text-sm md:col-span-2">
          <span>Coin Comment</span>
          <textarea
            name="comments"
            value={draft.comments as string}
            onChange={(event) => updateDraft("comments", event.target.value)}
            className="min-h-24 rounded border px-3 py-2"
          />
        </label>
        <fieldset className="grid gap-2 text-sm md:col-span-2">
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
              onChange={() => updateDraft("demonetizationStatus", "demonetized")}
            />{" "}
            Demonetized
          </label>
        </fieldset>
      </div>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      {successMessage ? (
        <p className="text-sm text-emerald-700">{successMessage}</p>
      ) : null}

      <div className="flex gap-2 border-t pt-4">
        <SubmitButton
          type="submit"
          isSubmitting={isPending}
          disabled={!hasRequiredCoinDraftFields(draft)}
        >
          {props.mode === "create" ? "Create Coin" : "Save"}
        </SubmitButton>
      </div>
    </form>
  )
}
