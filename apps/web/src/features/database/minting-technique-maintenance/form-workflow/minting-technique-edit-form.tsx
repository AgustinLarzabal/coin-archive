import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { TechniqueOption } from "@coin-archive/db"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  MintingTechniqueFieldErrors,
  MintingTechniqueMutationResult,
} from "../actions"
import {
  createMintingTechniqueInputSchema,
  submitUpdateMintingTechnique,
} from "../actions"

import {
  createMintingTechniqueDraft,
  normalizeMintingTechniqueDraft,
} from "./minting-technique-form.shared"
import {
  MintingTechniqueFormFields,
  MintingTechniqueTextField,
} from "./minting-technique-form-fields"
import type { MintingTechniqueDraft } from "./minting-technique-form.shared"

type MintingTechniqueEditFormProps = {
  mintingTechnique: TechniqueOption
  onSaved?: () => void
}

const updateMintingTechniqueAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: MintingTechniqueDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateMintingTechnique(session?.user ?? null, data)
  })

export function hasMintingTechniqueEditChanges(
  mintingTechnique: TechniqueOption,
  draft: MintingTechniqueDraft
) {
  const normalizedCurrent = normalizeMintingTechniqueDraft(
    createMintingTechniqueDraft(mintingTechnique)
  )
  const normalizedDraft = normalizeMintingTechniqueDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function MintingTechniqueEditForm({
  mintingTechnique,
  onSaved,
}: MintingTechniqueEditFormProps) {
  const router = useRouter()
  const updateMintingTechnique = useServerFn(updateMintingTechniqueAction)
  const [fieldErrors, setFieldErrors] = useState<MintingTechniqueFieldErrors>(
    {}
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createMintingTechniqueDraft(mintingTechnique),
    validators: { onSubmit: createMintingTechniqueInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateMintingTechnique({
        data: { id: mintingTechnique.id, ...value },
      })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createMintingTechniqueDraft(mintingTechnique))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [form, mintingTechnique])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: MintingTechniqueMutationResult) {
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
      id="database-minting-technique-edit-form"
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
            <MintingTechniqueFormFields variant="edit">
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
            {successMessage ? (
              <p className="text-sm text-emerald-700">{successMessage}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting ||
                  !hasMintingTechniqueEditChanges(
                    mintingTechnique,
                    state.values
                  )
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
