import { useCallback, useState } from "react"

import type {
  RulerFieldErrors,
  RulerMutationResult,
} from "../actions"

export function useRulerFormFeedback() {
  const [fieldErrors, setFieldErrors] = useState<RulerFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const clearFeedback = useCallback(() => {
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
  }, [])

  const applyResult = useCallback((result: RulerMutationResult) => {
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
  }, [])

  return {
    fieldErrors,
    formError,
    successMessage,
    clearFeedback,
    applyResult,
  }
}
