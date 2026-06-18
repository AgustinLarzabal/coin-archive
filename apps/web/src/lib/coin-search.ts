import { z } from "zod"

const optionalStringSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined
  }

  const normalizedValue = value.trim().toLowerCase()

  return normalizedValue === "" ? undefined : normalizedValue
}, z.string().optional())

export const coinSearchSchema = z.object({
  engraver: optionalStringSchema,
  issuer: optionalStringSchema,
})

export const coinListInputSchema = z.object({
  issuerCode: optionalStringSchema,
  engraverCode: optionalStringSchema,
})

export type CoinSearch = z.infer<typeof coinSearchSchema>
export type CoinListLoaderDeps = z.infer<typeof coinListInputSchema>
export type CoinSearchFilterName = keyof CoinSearch

export function getCoinListLoaderDeps(search: CoinSearch): CoinListLoaderDeps {
  return {
    engraverCode: search.engraver,
    issuerCode: search.issuer,
  }
}

export function hasActiveCoinSearchFilters(search: CoinSearch): boolean {
  return search.engraver !== undefined || search.issuer !== undefined
}

export function updateCoinSearchFilter<
  TFilterName extends CoinSearchFilterName,
>(
  currentSearch: CoinSearch,
  filterName: TFilterName,
  filterValue: CoinSearch[TFilterName] | "" | undefined
): CoinSearch {
  const nextSearch = { ...currentSearch }

  if (filterValue === undefined || filterValue === "") {
    delete nextSearch[filterName]

    return nextSearch
  }

  nextSearch[filterName] = filterValue

  return nextSearch
}
