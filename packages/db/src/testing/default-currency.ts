import type * as ClientModule from "../client"
import { currency } from "../schema/currency"
import type { Currency } from "../schema/currency"
import { getOrCreateDefaultEntity } from "./default-entity"

type Database = typeof ClientModule.db

export const defaultCurrencyValues = {
  code: "test-unit",
  name: "Test Unit",
  fullName: "Test Unit",
} as const

export async function getOrCreateDefaultCurrency(
  database: Database
): Promise<Currency> {
  return getOrCreateDefaultEntity(
    database,
    currency,
    currency.code,
    defaultCurrencyValues
  )
}
