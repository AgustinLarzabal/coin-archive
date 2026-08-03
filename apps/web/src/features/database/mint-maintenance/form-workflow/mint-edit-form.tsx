import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Mint } from "@coin-archive/api"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitUpdateMint } from "../actions"
import type { MintMutationResult } from "../actions"
import { createMintInputSchema } from "../mint-validation"
import type { MintFieldErrors } from "../mint-validation"

import { createMintDraft, hasMintEditChanges } from "./mint-form.shared"
import { MintFormFields, MintTextField } from "./mint-form-fields"
import type { MintDraft } from "./mint-form.shared"

type MintEditFormProps = {
  mint: Mint
  onSaved?: () => void
}

const updateMintAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: MintDraft & { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitUpdateMint(data))

export function MintEditForm({ mint, onSaved }: MintEditFormProps) {
  const router = useRouter()
  const updateMint = useServerFn(updateMintAction)
  const [fieldErrors, setFieldErrors] = useState<MintFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createMintDraft(mint),
    validators: { onSubmit: createMintInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateMint({
        data: {
          id: mint.id,
          etag: mint.etag,
          ...value,
        },
      })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createMintDraft(mint))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [form, mint])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: MintMutationResult) {
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
      id="database-mint-edit-form"
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
            <MintFormFields variant="edit">
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
                      <MintTextField
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
            </MintFormFields>

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
                  state.isSubmitting || !hasMintEditChanges(mint, state.values)
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
