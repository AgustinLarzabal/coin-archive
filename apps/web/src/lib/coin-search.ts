import { z } from "zod"

const optionalStringSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined
  }

  const normalizedValue = value.trim().toLowerCase()

  return normalizedValue === "" ? undefined : normalizedValue
}, z.string().optional())

const optionalTitleSearchSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined
  }

  const normalizedValue = value.trim()

  return normalizedValue === "" ? undefined : normalizedValue
}, z.string().optional())

const optionalCursorSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined
  }

  const normalizedValue = value.trim()

  return normalizedValue === "" ? undefined : normalizedValue
}, z.string().optional())

export const coinSearchSchema = z.object({
  cursor: optionalCursorSchema,
  distribution: optionalStringSchema,
  engraver: optionalStringSchema,
  issuer: optionalStringSchema,
  q: optionalTitleSearchSchema,
  ruler: optionalStringSchema,
  theme: optionalStringSchema,
})

export const coinListInputSchema = z.object({
  cursor: optionalCursorSchema,
  distributionCode: optionalStringSchema,
  engraverCode: optionalStringSchema,
  issuerCode: optionalStringSchema,
  q: optionalTitleSearchSchema,
  rulerCode: optionalStringSchema,
  themeCode: optionalStringSchema,
})

export type CoinSearch = z.infer<typeof coinSearchSchema>
export type CoinListLoaderDeps = z.infer<typeof coinListInputSchema>
export type CoinSearchFilterName = keyof CoinSearch

export function getCoinListLoaderDeps(search: CoinSearch): CoinListLoaderDeps {
  return {
    cursor: search.cursor,
    distributionCode: search.distribution,
    engraverCode: search.engraver,
    issuerCode: search.issuer,
    q: search.q,
    rulerCode: search.ruler,
    themeCode: search.theme,
  }
}

export function hasActiveCoinSearchFilters(search: CoinSearch): boolean {
  return (
    search.engraver !== undefined ||
    search.issuer !== undefined ||
    search.q !== undefined ||
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
