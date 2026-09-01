import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateCurrency,
  submitDeleteCurrency,
  submitUpdateCurrency,
} from "./actions.server"
import type { CurrencyDraft } from "./form-workflow/currency-form.shared"

export const createCurrencyMutation = createServerFn({ method: "POST" })
  .inputValidator((data: CurrencyDraft & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateCurrency(data))

export const replaceCurrencyMutation = createServerFn({ method: "POST" })
  .inputValidator((data: CurrencyDraft & { id: string; etag: string }) => data)
  .handler(({ data }) => submitUpdateCurrency(data))

export const deleteCurrencyMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteCurrency(data))
