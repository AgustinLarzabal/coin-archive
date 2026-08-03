import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitCreateTheme } from "../actions"
import type { ThemeMutationResult } from "../actions"
import { createThemeInputSchema } from "../theme-validation"
import type { ThemeFieldErrors } from "../theme-validation"

import { EMPTY_THEME_DRAFT, isThemeDraftComplete } from "./theme-form.shared"
import { ThemeFormFields, ThemeTextField } from "./theme-form-fields"
import type { ThemeDraft } from "./theme-form.shared"

type ThemeCreateFormProps = {
  onCreated?: (message: string) => void
}

const createThemeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: ThemeDraft & { idempotencyKey: string }) => data)
  .handler(async ({ data }) => submitCreateTheme(data))

export function ThemeCreateForm({ onCreated }: ThemeCreateFormProps) {
  const router = useRouter()
  const createTheme = useServerFn(createThemeAction)
  const [fieldErrors, setFieldErrors] = useState<ThemeFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  )

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: ThemeMutationResult): string | null {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      return result.message
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    return null
  }

  const form = useForm({
    defaultValues: EMPTY_THEME_DRAFT,
    validators: { onSubmit: createThemeInputSchema },
    onSubmit: async ({ value }) => {
      const result = await createTheme({
        data: { ...value, idempotencyKey },
      })
      const successMessage = applyResult(result)

      if (successMessage !== null) {
        form.reset()
        setIdempotencyKey(crypto.randomUUID())
        await router.invalidate()
        onCreated?.(successMessage)
      }
    },
  })

  return (
    <form
      id="database-theme-create-form"
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
            <ThemeFormFields variant="create">
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
                      <ThemeTextField
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
            </ThemeFormFields>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting || !isThemeDraftComplete(state.values)
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
