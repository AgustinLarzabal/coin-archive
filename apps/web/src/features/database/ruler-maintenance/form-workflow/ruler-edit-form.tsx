import { useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RulerGroupOption } from "@coin-archive/api"
import type { RulerOption } from "@coin-archive/db"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import { submitUpdateRuler } from "../actions"

import { RulerFormFields, RulerTextField } from "./ruler-form-fields"
import {
  createRulerDraft,
  getRulerGroupSelectionOptions,
  getUpdateRulerSubmission,
  normalizeRulerDraft,
} from "./ruler-form.shared"
import type { RulerDraft } from "./ruler-form.shared"
import { useRulerFormFeedback } from "./use-ruler-form-feedback"

type RulerEditFormProps = {
  ruler: RulerOption
  rulerGroups: RulerGroupOption[]
  onSaved?: () => void
}

const updateRulerAction = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: {
      id: string
      code: string
      name: string
      rulerGroupId: string | null
    }) => data
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateRuler(session?.user ?? null, data)
  })

export function hasRulerEditChanges(ruler: RulerOption, draft: RulerDraft) {
  const normalizedCurrent = normalizeRulerDraft(createRulerDraft(ruler))
  const normalizedDraft = normalizeRulerDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name ||
    normalizedDraft.rulerGroupLabel !== normalizedCurrent.rulerGroupLabel
  )
}

export function RulerEditForm({
  ruler,
  rulerGroups,
  onSaved,
}: RulerEditFormProps) {
  const router = useRouter()
  const updateRuler = useServerFn(updateRulerAction)
  const { fieldErrors, formError, successMessage, clearFeedback, applyResult } =
    useRulerFormFeedback()
  const rulerGroupOptions = getRulerGroupSelectionOptions(rulerGroups)

  const form = useForm({
    defaultValues: createRulerDraft(ruler),
    onSubmit: async ({ value }) => {
      const submission = getUpdateRulerSubmission(ruler.id, value, rulerGroups)
      if (submission.status === "invalid") {
        applyResult(submission.result)
        return
      }
      const result = await updateRuler({ data: submission.data })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createRulerDraft(ruler))
    clearFeedback()
  }, [clearFeedback, form, ruler])

  return (
    <form
      id="database-ruler-edit-form"
      className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4"
      onSubmit={(event) => {
        event.preventDefault()
        clearFeedback()
        void form.handleSubmit()
      }}
    >
      <form.Subscribe selector={(state) => state}>
        {(state) => (
          <>
            <RulerFormFields
              rulerGroupOptionsListId="ruler-group-options-edit"
              rulerGroupOptions={rulerGroupOptions}
              variant="edit"
            >
              {(config) => (
                <form.Field key={config.field} name={config.field}>
                  {(field) => {
                    const serverError = fieldErrors[config.errorField]
                    const isInvalid = serverError !== undefined
                    return (
                      <RulerTextField
                        {...config}
                        errors={serverError ? [{ message: serverError }] : []}
                        isInvalid={isInvalid}
                        onBlur={field.handleBlur}
                        onChange={field.handleChange}
                        value={field.state.value}
                      />
                    )
                  }}
                </form.Field>
              )}
            </RulerFormFields>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            {successMessage ? (
              <p className="text-sm text-emerald-700">{successMessage}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting ||
                  !hasRulerEditChanges(ruler, state.values)
                }
                className="w-full"
              >
                Save
              </SubmitButton>
            </div>
          </>
        )}
      </form.Subscribe>
    </form>
  )
}
