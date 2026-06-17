import { z } from "zod"

const optionalStringSchema = z.string().optional()

export const coinSearchSchema = z.object({
  issuer: optionalStringSchema,
})

export const coinListInputSchema = z.object({
  issuerCode: optionalStringSchema,
})

export type CoinSearch = z.infer<typeof coinSearchSchema>
export type CoinListLoaderDeps = z.infer<typeof coinListInputSchema>
export type CoinSearchFilterName = keyof CoinSearch

export function getCoinListLoaderDeps(search: CoinSearch): CoinListLoaderDeps {
  return {
    issuerCode: search.issuer,
  }
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
