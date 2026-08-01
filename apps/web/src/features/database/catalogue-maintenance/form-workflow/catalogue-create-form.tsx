import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { FieldError } from "@coin-archive/ui/components/field"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import { submitCreateCatalogue } from "../actions"
import type { CatalogueMutationResult } from "../catalogue-mutation-errors"
import { createCatalogueInputSchema } from "../catalogue-validation"
import type { CatalogueFieldErrors } from "../catalogue-validation"

import {
  CatalogueFormFields,
  CatalogueTextField,
} from "./catalogue-form-fields"
import {
  EMPTY_CATALOGUE_DRAFT,
  hasCatalogueCreateInput,
} from "./catalogue-form.shared"
import type { CatalogueDraft } from "./catalogue-form.shared"

type CatalogueCreateFormProps = {
  onCreated?: () => void
}

const createCatalogueMaintenanceCatalogue = createServerFn({
  method: "POST",
})
  .inputValidator((data: CatalogueDraft) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCreateCatalogue(session?.user ?? null, data)
  })

export function CatalogueCreateForm({ onCreated }: CatalogueCreateFormProps) {
  const router = useRouter()
  const createCatalogue = useServerFn(createCatalogueMaintenanceCatalogue)
  const [fieldErrors, setFieldErrors] = useState<CatalogueFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: CatalogueMutationResult) {
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
    defaultValues: EMPTY_CATALOGUE_DRAFT,
    validators: {
      onSubmit: createCatalogueInputSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await createCatalogue({
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
      id="database-catalogue-create-form"
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
            <CatalogueFormFields variant="create">
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

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting || !hasCatalogueCreateInput(state.values)
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
