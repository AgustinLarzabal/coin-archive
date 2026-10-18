import type { CurrencyResponse } from "@workspace/api"
import type { CurrencyRecord } from "@workspace/db"

export function toCurrencyResponse({
  slug,
  name,
  periodLabel,
}: CurrencyRecord): CurrencyResponse {
  return { slug, name, fullName: `${name} (${periodLabel})` }
}
