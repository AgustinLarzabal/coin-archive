import type { CurrencyOption } from "@workspace/db"

export type CurrencyDraft = {
  code: string
  name: string
  fullName: string
}

export const EMPTY_CURRENCY_DRAFT: CurrencyDraft = {
  code: "",
  name: "",
  fullName: "",
}

export function createCurrencyDraft(currency: CurrencyOption): CurrencyDraft {
  return {
    code: currency.code,
    name: currency.name,
    fullName: currency.fullName,
  }
}

export function normalizeCurrencyDraft(draft: CurrencyDraft): CurrencyDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
    fullName: draft.fullName.trim(),
  }
}

export function isCurrencyDraftComplete(draft: CurrencyDraft) {
  const normalizedDraft = normalizeCurrencyDraft(draft)

  return (
    normalizedDraft.code.length > 0 &&
    normalizedDraft.name.length > 0 &&
    normalizedDraft.fullName.length > 0
  )
}
