import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  MintingTechniqueFieldErrors,
  MintingTechniqueMutationResult,
} from "../actions"
import {
  createMintingTechniqueInputSchema,
  submitCreateMintingTechnique,
} from "../actions"

import {
  EMPTY_MINTING_TECHNIQUE_DRAFT,
  isMintingTechniqueDraftComplete,
} from "./minting-technique-form.shared"
import {
  MintingTechniqueFormFields,
  MintingTechniqueTextField,
} from "./minting-technique-form-fields"
import type { MintingTechniqueDraft } from "./minting-technique-form.shared"

type MintingTechniqueCreateFormProps = {
  onCreated?: () => void
}

const createMintingTechniqueAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: MintingTechniqueDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateMintingTechnique(session?.user ?? null, data)
  })

export function MintingTechniqueCreateForm({
  onCreated,
}: MintingTechniqueCreateFormProps) {
  const router = useRouter()
  const createMintingTechnique = useServerFn(createMintingTechniqueAction)
  const [fieldErrors, setFieldErrors] = useState<MintingTechniqueFieldErrors>(
    {}
  )
  const [formError, setFormError] = useState<string | null>(null)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: MintingTechniqueMutationResult) {
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
    defaultValues: EMPTY_MINTING_TECHNIQUE_DRAFT,
    validators: { onSubmit: createMintingTechniqueInputSchema },
    onSubmit: async ({ value }) => {
      const result = await createMintingTechnique({
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
      id="database-minting-technique-create-form"
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
            <MintingTechniqueFormFields variant="create">
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
                      <MintingTechniqueTextField
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
            </MintingTechniqueFormFields>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting ||
                  !isMintingTechniqueDraftComplete(state.values)
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
