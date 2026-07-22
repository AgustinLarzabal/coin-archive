import type { CoinDraft, CoinFieldErrors } from "../actions"
import type { CoinFormOptions } from "../coin-form.shared"

export type UpdateCoinDraft = <TFieldName extends keyof CoinDraft>(
  field: TFieldName,
  value: CoinDraft[TFieldName]
) => void

export type CoinFormSectionProps = {
  draft: CoinDraft
  fieldErrors: CoinFieldErrors
  idPrefix: string
  options: CoinFormOptions
  updateDraft: UpdateCoinDraft
}

export function CoinFormFieldError({ message }: { message?: string }) {
  return message ? (
    <span className="text-sm text-destructive">{message}</span>
  ) : null
}
