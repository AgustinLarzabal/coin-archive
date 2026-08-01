import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RulerGroupOption } from "@coin-archive/db"
import { SubmitButton } from "@coin-archive/ui/components/submit-button"

import { getAuthSession } from "@/lib/auth-session"
import type {
  RulerGroupFieldErrors,
  RulerGroupMutationResult,
} from "../actions"
import { createRulerGroupInputSchema, submitUpdateRulerGroup } from "../actions"

import {
  createRulerGroupDraft,
  normalizeRulerGroupDraft,
} from "./ruler-group-form.shared"
import {
  RulerGroupFormFields,
  RulerGroupTextField,
} from "./ruler-group-form-fields"
import type { RulerGroupDraft } from "./ruler-group-form.shared"

type RulerGroupEditFormProps = {
  rulerGroup: RulerGroupOption
  onSaved?: () => void
}

const updateRulerGroupAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: RulerGroupDraft & { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitUpdateRulerGroup(session?.user ?? null, data)
  })

export function hasRulerGroupEditChanges(
  rulerGroup: RulerGroupOption,
  draft: RulerGroupDraft
) {
  const normalizedCurrent = normalizeRulerGroupDraft(
    createRulerGroupDraft(rulerGroup)
  )
  const normalizedDraft = normalizeRulerGroupDraft(draft)

  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}

export function RulerGroupEditForm({
  rulerGroup,
  onSaved,
}: RulerGroupEditFormProps) {
  const router = useRouter()
  const updateRulerGroup = useServerFn(updateRulerGroupAction)
  const [fieldErrors, setFieldErrors] = useState<RulerGroupFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: createRulerGroupDraft(rulerGroup),
    validators: { onSubmit: createRulerGroupInputSchema },
    onSubmit: async ({ value }) => {
      const result = await updateRulerGroup({
        data: { id: rulerGroup.id, ...value },
      })
      const shouldRefresh = applyResult(result)
      if (shouldRefresh) {
        await router.invalidate()
        onSaved?.()
      }
    },
  })

  useEffect(() => {
    form.reset(createRulerGroupDraft(rulerGroup))
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [form, rulerGroup])

  function clearFeedback() {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }

  function applyResult(result: RulerGroupMutationResult) {
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
      id="database-ruler-group-edit-form"
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
            <RulerGroupFormFields variant="edit">
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
            {successMessage ? (
              <p className="text-sm text-emerald-700">{successMessage}</p>
            ) : null}

            <div className="mt-auto flex gap-2 border-t pt-4">
              <SubmitButton
                type="submit"
                isSubmitting={state.isSubmitting}
                disabled={
                  state.isSubmitting ||
                  !hasRulerGroupEditChanges(rulerGroup, state.values)
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
