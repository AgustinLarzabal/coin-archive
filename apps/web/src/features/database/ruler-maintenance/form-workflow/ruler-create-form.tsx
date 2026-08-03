import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RulerGroupOption } from "@coin-archive/api"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import { submitCreateRuler } from "../actions"

import { RulerFormFields, RulerTextField } from "./ruler-form-fields"
import {
  EMPTY_RULER_DRAFT,
  getCreateRulerSubmission,
  getRulerGroupSelectionOptions,
  isRulerDraftComplete,
} from "./ruler-form.shared"
import { useRulerFormFeedback } from "./use-ruler-form-feedback"

type RulerCreateFormProps = {
  rulerGroups: RulerGroupOption[]
  onCreated?: () => void
}

const createRulerAction = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: { code: string; name: string; rulerGroupId: string | null }) => data
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateRuler(session?.user ?? null, data)
  })

export function RulerCreateForm({
  rulerGroups,
  onCreated,
}: RulerCreateFormProps) {
  const router = useRouter()
  const createRuler = useServerFn(createRulerAction)
  const { fieldErrors, formError, clearFeedback, applyResult } =
    useRulerFormFeedback()
  const rulerGroupOptions = getRulerGroupSelectionOptions(rulerGroups)

  const form = useForm({
    defaultValues: EMPTY_RULER_DRAFT,
    onSubmit: async ({ value }) => {
      const submission = getCreateRulerSubmission(value, rulerGroups)

      if (submission.status === "invalid") {
        applyResult(submission.result)
        return
      }

      const result = await createRuler({
        data: submission.data,
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        form.reset()
        await router.invalidate()
        onCreated?.()
      }
    },
  })

  return (
    <form
      id="database-ruler-create-form"
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
              rulerGroupOptionsListId="ruler-group-options-create"
              rulerGroupOptions={rulerGroupOptions}
              variant="create"
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

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting || !isRulerDraftComplete(state.values)
                }
                className="w-full"
              >
                Create
              </SubmitButton>
            </div>
          </>
        )}
      </form.Subscribe>
    </form>
  )
}
