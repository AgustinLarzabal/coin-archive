import type { CurrencyResponse } from "@coin-archive/api"
import type { CurrencyRecord } from "@coin-archive/db"

export function toCurrencyResponse({
  slug,
  name,
  periodLabel,
}: CurrencyRecord): CurrencyResponse {
  return { slug, name, fullName: `${name} (${periodLabel})` }
}
