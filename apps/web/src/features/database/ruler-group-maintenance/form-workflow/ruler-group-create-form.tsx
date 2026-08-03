import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { submitCreateRulerGroup } from "../actions"
import type { RulerGroupMutationResult } from "../actions"
import { createRulerGroupInputSchema } from "../ruler-group-validation"
import type { RulerGroupFieldErrors } from "../ruler-group-validation"

import {
  EMPTY_RULER_GROUP_DRAFT,
  isRulerGroupDraftComplete,
} from "./ruler-group-form.shared"
import {
  RulerGroupFormFields,
  RulerGroupTextField,
} from "./ruler-group-form-fields"
import type { RulerGroupDraft } from "./ruler-group-form.shared"

type RulerGroupCreateFormProps = {
  onCreated?: () => void
}

const createRulerGroupAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: RulerGroupDraft & { idempotencyKey: string }) => data)
  .handler(async ({ data }) => submitCreateRulerGroup(data))

export function RulerGroupCreateForm({ onCreated }: RulerGroupCreateFormProps) {
  const router = useRouter()
  const createRulerGroup = useServerFn(createRulerGroupAction)
  const [fieldErrors, setFieldErrors] = useState<RulerGroupFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  )

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
  }

  function applyResult(result: RulerGroupMutationResult) {
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
    defaultValues: EMPTY_RULER_GROUP_DRAFT,
    validators: { onSubmit: createRulerGroupInputSchema },
    onSubmit: async ({ value }) => {
      const result = await createRulerGroup({
        data: { ...value, idempotencyKey },
      })
      const shouldRefresh = applyResult(result)

      if (shouldRefresh) {
        form.reset()
        setIdempotencyKey(crypto.randomUUID())
        await router.invalidate()
        onCreated?.()
      }
    },
  })

  return (
    <form
      id="database-ruler-group-create-form"
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
            <RulerGroupFormFields variant="create">
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
                      <RulerGroupTextField
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
            </RulerGroupFormFields>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting || !isRulerGroupDraftComplete(state.values)
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
