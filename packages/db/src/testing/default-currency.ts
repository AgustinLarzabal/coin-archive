import { eq } from "drizzle-orm"
import { currency, type Currency } from "../schema/currency"

type Database = typeof import("../client").db

export const defaultCurrencyValues = {
  code: "test-unit",
  name: "Test Unit",
  fullName: "Test Unit",
} as const

export async function getOrCreateDefaultCurrency(
  database: Database
): Promise<Currency> {
  const [existingCurrency] = await database
    .select()
    .from(currency)
    .where(eq(currency.code, defaultCurrencyValues.code))
    .limit(1)

  if (existingCurrency) {
    return existingCurrency
  }

  const [createdCurrency] = await database
    .insert(currency)
    .values(defaultCurrencyValues)
    .returning()

  return createdCurrency
}
