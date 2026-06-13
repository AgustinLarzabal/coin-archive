import { asc } from "drizzle-orm"

import { db } from "../client"
import { currency } from "../schema/currency"
import type { Currency } from "../schema/currency"

const getCurrenciesSelection = {
  id: currency.id,
  code: currency.code,
  name: currency.name,
  fullName: currency.fullName,
  createdAt: currency.createdAt,
  updatedAt: currency.updatedAt,
}

export type CurrencyOption = Pick<
  Currency,
  "id" | "code" | "name" | "fullName" | "createdAt" | "updatedAt"
>

export async function getCurrencies(): Promise<CurrencyOption[]> {
  return db
    .select(getCurrenciesSelection)
    .from(currency)
    .orderBy(asc(currency.name), asc(currency.code))
}
