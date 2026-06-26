import { eq } from "drizzle-orm"

import { db } from "../client"
import { currency } from "../schema/currency"
import type { Currency } from "../schema/currency"

type CurrencyFields = {
  code: string
  name: string
  fullName: string
}

type UpdateCurrencyInput = CurrencyFields & {
  id: string
}

type DeleteCurrencyInput = {
  id: string
}

function takeFirstOrNull<T>(records: T[]): T | null {
  return records.at(0) ?? null
}

function normalizeCurrencyFields({ code, name, fullName }: CurrencyFields) {
  return {
    code: code.trim(),
    name: name.trim(),
    fullName: fullName.trim(),
  }
}

export async function createCurrency(
  fields: CurrencyFields
): Promise<Currency> {
  const [createdCurrency] = await db
    .insert(currency)
    .values(normalizeCurrencyFields(fields))
    .returning()

  return createdCurrency
}

export async function updateCurrency({
  id,
  ...fields
}: UpdateCurrencyInput): Promise<Currency | null> {
  return takeFirstOrNull(
    await db
      .update(currency)
      .set({
        ...normalizeCurrencyFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(currency.id, id))
      .returning()
  )
}

export async function deleteCurrency({
  id,
}: DeleteCurrencyInput): Promise<Currency | null> {
  return takeFirstOrNull(
    await db.delete(currency).where(eq(currency.id, id)).returning()
  )
}
