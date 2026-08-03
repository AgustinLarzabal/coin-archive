import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Theme } from "@coin-archive/api"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitUpdateTheme } from "../actions"
import type { ThemeMutationResult } from "../actions"
import { createThemeInputSchema } from "../theme-validation"
import type { ThemeFieldErrors } from "../theme-validation"

import { createThemeDraft, hasThemeEditChanges } from "./theme-form.shared"
import { ThemeFormFields, ThemeTextField } from "./theme-form-fields"
import type { ThemeDraft } from "./theme-form.shared"

type ThemeEditFormProps = {
  theme: Theme
  onSaved?: (message: string) => void
}

const updateThemeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: ThemeDraft & { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitUpdateTheme(data))

export function ThemeEditForm({ theme, onSaved }: ThemeEditFormProps) {
  const router = useRouter()
  const updateTheme = useServerFn(updateThemeAction)
  const [fieldErrors, setFieldErrors] = useState<ThemeFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createThemeDraft(theme),
    validators: { onSubmit: createThemeInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateTheme({
        data: { id: theme.id, etag: theme.etag, ...value },
      })
      const savedMessage = applyResult(result)
      if (savedMessage !== null) {
        await router.invalidate()
        onSaved?.(savedMessage)
      }
    },
  })

  useEffect(() => {
    form.reset(createThemeDraft(theme))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [form, theme])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: ThemeMutationResult): string | null {
    if (result.status === "success") {
      setFieldErrors({})
      setFormError(null)
      setSuccessMessage(result.message)
      return result.message
    }

    setFieldErrors(result.fieldErrors)
    setFormError(result.formError ?? null)
    setSuccessMessage(null)
    return null
  }

  return (
    <form
      id="database-theme-edit-form"
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
            <ThemeFormFields variant="edit">
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
            {successMessage ? (
              <p className="text-sm text-emerald-700">{successMessage}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting ||
                  !hasThemeEditChanges(theme, state.values)
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
