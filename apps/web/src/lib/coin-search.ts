export type CoinSearch = {
  issuer?: string
  ruler?: string
}

export function updateCoinSearchFilter(
  currentSearch: CoinSearch,
  filterName: keyof CoinSearch,
  filterValue: string | undefined
): CoinSearch {
  const nextSearch = { ...currentSearch }

  if (filterValue === undefined) {
    delete nextSearch[filterName]

    return nextSearch
  }

  nextSearch[filterName] = filterValue

  return nextSearch
}

export function getRulerOptionLabel(ruler: {
  name: string
  group: { name: string } | null
}) {
  return ruler.group ? `${ruler.name} · ${ruler.group.name}` : ruler.name
}
