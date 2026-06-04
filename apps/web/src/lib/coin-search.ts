import type { CatalogueOption, RulerOption } from "@workspace/db"
import { z } from "zod"

export type CoinSearch = {
  catalogue?: string
  issuer?: string
  referenceNumber?: string
  ruler?: string
}

export type CoinSearchFilterName = keyof CoinSearch

const optionalStringSchema = z.string().optional()

export const coinSearchSchema = z.object({
  catalogue: optionalStringSchema,
  issuer: optionalStringSchema,
  referenceNumber: optionalStringSchema,
  ruler: optionalStringSchema,
})

export const coinListInputSchema = z.object({
  catalogueCode: optionalStringSchema,
  issuerCode: optionalStringSchema,
  referenceNumber: optionalStringSchema,
  rulerCode: optionalStringSchema,
})

export function getCoinListLoaderDeps(search: CoinSearch) {
  return {
    catalogueCode: search.catalogue,
    issuerCode: search.issuer,
    referenceNumber: search.referenceNumber,
    rulerCode: search.ruler,
  }
}

export function findSelectedCatalogueOption(
  catalogues: CatalogueOption[],
  selectedCatalogueCode: string | undefined
) {
  if (!selectedCatalogueCode) {
    return null
  }

  return (
    catalogues.find(
      (catalogue) =>
        catalogue.code.toLowerCase() === selectedCatalogueCode.toLowerCase()
    ) ?? null
  )
}

export function updateCoinSearchFilter(
  currentSearch: CoinSearch,
  filterName: CoinSearchFilterName,
  filterValue: string | undefined
): CoinSearch {
  const nextSearch = { ...currentSearch }

  if (filterValue === undefined || filterValue === "") {
    delete nextSearch[filterName]

    return nextSearch
  }

  nextSearch[filterName] = filterValue

  return nextSearch
}

type RulerOptionLabel = Pick<RulerOption, "name" | "group">
type CatalogueOptionLabel = Pick<CatalogueOption, "title" | "code">

export function getCatalogueOptionLabel(catalogue: CatalogueOptionLabel) {
  return `${catalogue.title} · ${catalogue.code}`
}

export function getRulerOptionLabel(ruler: RulerOptionLabel) {
  return ruler.group ? `${ruler.name} · ${ruler.group.name}` : ruler.name
}
