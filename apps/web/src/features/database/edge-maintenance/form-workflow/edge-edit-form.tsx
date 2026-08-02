import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Edge } from "@coin-archive/api"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitUpdateEdge } from "../actions"
import type { EdgeMutationResult } from "../actions"
import { createEdgeInputSchema } from "../edge-validation"
import type { EdgeFieldErrors } from "../edge-validation"

import { createEdgeDraft, hasEdgeEditChanges } from "./edge-form.shared"
import { EdgeFormFields, EdgeTextField } from "./edge-form-fields"
import type { EdgeDraft } from "./edge-form.shared"

type EdgeEditFormProps = {
  edge: Edge
  onSaved?: () => void
}

const updateEdgeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: EdgeDraft & { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitUpdateEdge(data))

export function EdgeEditForm({ edge, onSaved }: EdgeEditFormProps) {
  const router = useRouter()
  const updateEdge = useServerFn(updateEdgeAction)
  const [fieldErrors, setFieldErrors] = useState<EdgeFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createEdgeDraft(edge),
    validators: { onSubmit: createEdgeInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateEdge({
        data: { id: edge.id, etag: edge.etag, ...value },
      })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createEdgeDraft(edge))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [form, edge])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: EdgeMutationResult) {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      setSuccessMessage(result.message)
      return true
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    setSuccessMessage(null)
    return false
  }

  return (
    <form
      id="database-edge-edit-form"
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
            <EdgeFormFields variant="edit">
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
            {successMessage ? (
              <p className="text-sm text-emerald-700">{successMessage}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting || !hasEdgeEditChanges(edge, state.values)
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
