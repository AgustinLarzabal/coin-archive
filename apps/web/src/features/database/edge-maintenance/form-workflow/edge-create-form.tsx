import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import { submitCreateEdge } from "../actions"
import type { EdgeMutationResult } from "../edge-mutation-errors"
import { createEdgeInputSchema } from "../edge-validation"
import type { EdgeFieldErrors } from "../edge-validation"

import { EdgeFormFields, EdgeTextField } from "./edge-form-fields"
import { EMPTY_EDGE_DRAFT, isEdgeDraftComplete } from "./edge-form.shared"
import type { EdgeDraft } from "./edge-form.shared"

type EdgeCreateFormProps = {
  onCreated?: () => void
}

const createEdgeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: EdgeDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateEdge(session?.user ?? null, data)
  })

export function EdgeCreateForm({ onCreated }: EdgeCreateFormProps) {
  const router = useRouter()
  const createEdge = useServerFn(createEdgeAction)
  const [fieldErrors, setFieldErrors] = useState<EdgeFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: EdgeMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return false
  }

  const form = useForm({
    defaultValues: EMPTY_EDGE_DRAFT,
    validators: { onSubmit: createEdgeInputSchema },
    onSubmit: async ({ value }) => {
      const result = await createEdge({
        data: value,
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
      id="database-edge-create-form"
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
            <EdgeFormFields variant="create">
              {(config) => (
                <form.Field key={config.field} name={config.field}>
                  {(field) => {
                    const serverError = fieldErrors[config.field]
                    const isInvalid =
                      (field.state.meta.isTouched &&
                        !field.state.meta.isValid) ||
                      serverError !== undefined
                    const errors = serverError
                      ? [...field.state.meta.errors, { message: serverError }]
                      : field.state.meta.errors
                    return (
                      <EdgeTextField
                        {...config}
                        errors={errors}
                        isInvalid={isInvalid}
                        onBlur={field.handleBlur}
                        onChange={field.handleChange}
                        value={field.state.value}
                      />
                    )
                  }}
                </form.Field>
              )}
            </EdgeFormFields>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting || !isEdgeDraftComplete(state.values)
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
