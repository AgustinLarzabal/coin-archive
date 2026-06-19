import { z } from "zod"

const optionalStringSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined
  }

  const normalizedValue = value.trim().toLowerCase()

  return normalizedValue === "" ? undefined : normalizedValue
}, z.string().optional())

export const coinSearchSchema = z.object({
  distribution: optionalStringSchema,
  engraver: optionalStringSchema,
  issuer: optionalStringSchema,
  ruler: optionalStringSchema,
  theme: optionalStringSchema,
})

export const coinListInputSchema = z.object({
  distributionCode: optionalStringSchema,
  engraverCode: optionalStringSchema,
  issuerCode: optionalStringSchema,
  rulerCode: optionalStringSchema,
  themeCode: optionalStringSchema,
})

export type CoinSearch = z.infer<typeof coinSearchSchema>
export type CoinListLoaderDeps = z.infer<typeof coinListInputSchema>
export type CoinSearchFilterName = keyof CoinSearch

export function getCoinListLoaderDeps(search: CoinSearch): CoinListLoaderDeps {
  return {
    distributionCode: search.distribution,
    engraverCode: search.engraver,
    issuerCode: search.issuer,
    rulerCode: search.ruler,
    themeCode: search.theme,
  }
}

export function hasActiveCoinSearchFilters(search: CoinSearch): boolean {
  return (
    search.engraver !== undefined ||
    search.issuer !== undefined ||
    search.ruler !== undefined ||
    search.distribution !== undefined ||
    search.theme !== undefined
  )
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
