import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Shape } from "@coin-archive/api"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitUpdateShape } from "../actions"
import type { ShapeMutationResult } from "../actions"
import { createShapeInputSchema } from "../shape-validation"
import type { ShapeFieldErrors } from "../shape-validation"

import { createShapeDraft, hasShapeEditChanges } from "./shape-form.shared"
import { ShapeFormFields, ShapeTextField } from "./shape-form-fields"
import type { ShapeDraft } from "./shape-form.shared"

type ShapeEditFormProps = {
  shape: Shape
  onSaved?: () => void
}

const updateShapeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: ShapeDraft & { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitUpdateShape(data))

export function ShapeEditForm({ shape, onSaved }: ShapeEditFormProps) {
  const router = useRouter()
  const updateShape = useServerFn(updateShapeAction)
  const [fieldErrors, setFieldErrors] = useState<ShapeFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createShapeDraft(shape),
    validators: { onSubmit: createShapeInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateShape({
        data: { id: shape.id, etag: shape.etag, ...value },
      })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createShapeDraft(shape))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [form, shape])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: ShapeMutationResult) {
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
      id="database-shape-edit-form"
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
            <ShapeFormFields variant="edit">
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
                      <ShapeTextField
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
            </ShapeFormFields>

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
                  !hasShapeEditChanges(shape, state.values)
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
