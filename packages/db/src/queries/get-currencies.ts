import { asc } from "drizzle-orm"

import { db } from "../client"
import { currency } from "../schema/currency"
import type { Currency } from "../schema/currency"

const getCurrenciesSelection = {
  createdAt: currency.createdAt,
  code: currency.code,
  fullName: currency.fullName,
  id: currency.id,
  name: currency.name,
  updatedAt: currency.updatedAt,
}

export type CurrencyOption = Pick<
  Currency,
  "code" | "createdAt" | "fullName" | "id" | "name" | "updatedAt"
>

export async function getCurrencies(): Promise<CurrencyOption[]> {
  return db
    .select(getCurrenciesSelection)
    .from(currency)
    .orderBy(asc(currency.name), asc(currency.code))
}
