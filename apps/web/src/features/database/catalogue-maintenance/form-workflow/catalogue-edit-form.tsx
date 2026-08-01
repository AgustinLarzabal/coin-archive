import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CatalogueOption } from "@coin-archive/db"
import { FieldError } from "@coin-archive/ui/components/field"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import { submitUpdateCatalogue } from "../actions"
import type { CatalogueMutationResult } from "../catalogue-mutation-errors"
import { createCatalogueInputSchema } from "../catalogue-validation"
import type { CatalogueFieldErrors } from "../catalogue-validation"

import {
  CatalogueFormFields,
  CatalogueTextField,
} from "./catalogue-form-fields"
import {
  createCatalogueDraft,
  hasCatalogueEditChanges,
} from "./catalogue-form.shared"
import type { CatalogueDraft } from "./catalogue-form.shared"

const updateCatalogueMaintenanceCatalogue = createServerFn({
  method: "POST",
})
  .inputValidator((data: CatalogueDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateCatalogue(session?.user ?? null, data)
  })

type CatalogueEditFormProps = {
  catalogue: CatalogueOption
  onSaved?: () => void
}

export function CatalogueEditForm({
  catalogue,
  onSaved,
}: CatalogueEditFormProps) {
  const router = useRouter()
  const updateCatalogue = useServerFn(updateCatalogueMaintenanceCatalogue)
  const [fieldErrors, setFieldErrors] = useState<CatalogueFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createCatalogueDraft(catalogue),
    validators: {
      onSubmit: createCatalogueInputSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await updateCatalogue({
        data: {
          id: catalogue.id,
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
    form.reset(createCatalogueDraft(catalogue))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [catalogue, form])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: CatalogueMutationResult) {
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
      id="database-catalogue-edit-form"
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
            <CatalogueFormFields variant="edit">
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
                      <CatalogueTextField
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
            </CatalogueFormFields>

            {formError ? <FieldError>{formError}</FieldError> : null}
            {successMessage ? (
              <p className="text-sm text-emerald-700">{successMessage}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting ||
                  !hasCatalogueEditChanges(catalogue, state.values)
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
