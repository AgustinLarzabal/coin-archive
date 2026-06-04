import type { CatalogueOption, RulerOption } from "@workspace/db"

export type CoinSearch = {
  catalogue?: string
  issuer?: string
  referenceNumber?: string
  ruler?: string
}

export type CoinSearchFilterName = keyof CoinSearch

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
