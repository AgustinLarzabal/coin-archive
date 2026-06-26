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

function normalizeCurrencyFields({ code, name, fullName }: CurrencyFields) {
  return {
    code: code.trim(),
    name: name.trim(),
    fullName: fullName.trim(),
  }
}

export async function createCurrency(fields: CurrencyFields): Promise<Currency> {
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
  const updatedCurrency = (
    await db
      .update(currency)
      .set({
        ...normalizeCurrencyFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(currency.id, id))
      .returning()
  ).at(0)

  if (!updatedCurrency) {
    return null
  }

  return updatedCurrency
}

export async function deleteCurrency({
  id,
}: DeleteCurrencyInput): Promise<Currency | null> {
  const deletedCurrency = (
    await db.delete(currency).where(eq(currency.id, id)).returning()
  ).at(0)

  if (!deletedCurrency) {
    return null
  }

  return deletedCurrency
}
